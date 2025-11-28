
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { base64ToBytes, decodeAudioData, resampleTo16kHZ, bytesToBase64, float32ToInt16 } from '../services/audioUtils';
import { TranscriptItem, AppState, VoiceName } from '../types';

const SYSTEM_INSTRUCTION = `You are a professional, encouraging, yet neutral IELTS Speaking Examiner. 
Conduct a simulation of the IELTS Speaking Test (Part 1, 2, and 3).
1. Start by briefly introducing yourself and asking for the candidate's full name.
2. Maintain the flow of a real exam. Do not break character.
3. Keep your responses concise (spoken style) but clear.
4. Listen carefully to the user's answers.
5. If the user stops speaking, gently prompt them or move to the next question.
6. Provide brief encouraging remarks but maintain examiner distance.
`;

export const useGeminiLive = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sessionRef = useRef<any>(null);
  const isConnectedRef = useRef<boolean>(false);
  const currentOutputTranscriptRef = useRef<string>('');
  const currentInputTranscriptRef = useRef<string>('');

  // Audio Recording Refs (Mixed Stream)
  const recordingDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioBlobRef = useRef<Blob | null>(null);

  const cleanupAudio = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop Recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const connect = useCallback(async (voiceName: VoiceName = 'Kore') => {
    try {
      setAppState(AppState.CONNECTING);
      setTranscripts([]); // Clear previous transcripts
      audioChunksRef.current = []; // Clear previous audio
      recordedAudioBlobRef.current = null;

      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found in environment variables");
      }

      const ai = new GoogleGenAI({ apiKey });

      // Initialize Audio Contexts
      // Main Context for Output & Mixing (24kHz is standard output rate)
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      // Separate Input Context for 16kHz processing (required by Gemini Input)
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      // Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true,
        }
      });
      streamRef.current = stream;

      // --- START MIXED RECORDING SETUP ---
      // Create a destination node where we will send both Mic and AI Audio
      const recordingDest = ctx.createMediaStreamDestination();
      recordingDestRef.current = recordingDest;

      // 1. Route Microphone to Recorder (but NOT to destination/speakers to avoid echo)
      const micSourceForRecord = ctx.createMediaStreamSource(stream);
      micSourceForRecord.connect(recordingDest);

      // Initialize MediaRecorder with the MIXED stream
      try {
        const mediaRecorder = new MediaRecorder(recordingDest.stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
      } catch (e) {
        console.warn("MediaRecorder failed to initialize", e);
      }
      // -----------------------------------

      // Connect to Gemini Live
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: async () => {
            console.log("Session opened");
            setAppState(AppState.ACTIVE);

            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
            }

            if (!inputContextRef.current || !streamRef.current) return;

            // Process Mic Stream for Gemini Input (16kHz)
            const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);

            sourceRef.current = source;
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);

              // Volume meter
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolumeLevel(rms);

              // Resample
              const currentSampleRate = inputContextRef.current?.sampleRate || 16000;
              let pcmData: Int16Array;

              if (currentSampleRate !== 16000) {
                pcmData = resampleTo16kHZ(inputData, currentSampleRate);
              } else {
                pcmData = float32ToInt16(inputData);
              }

              const base64Data = bytesToBase64(new Uint8Array(pcmData.buffer));

              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data
                  }
                });
              });
            };

            source.connect(processor);
            processor.connect(inputContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // 1. 处理转录文本（先收集，稍后同步显示）
            const outputTranscript = msg.serverContent?.outputTranscription?.text;
            if (outputTranscript) {
              currentOutputTranscriptRef.current += outputTranscript;
            }

            const inputTranscript = msg.serverContent?.inputTranscription?.text;
            if (inputTranscript) {
              // 只有在没有 AI 输出时才更新用户输入
              if (!currentOutputTranscriptRef.current) {
                currentInputTranscriptRef.current += inputTranscript;
                updateTranscript('user', currentInputTranscriptRef.current, true);
              }
            }

            // 2. 处理音频输出（音频播放时同步显示文本）
            const part = msg.serverContent?.modelTurn?.parts?.[0];
            const audioData = part?.inlineData?.data;

            if (audioData && audioContextRef.current) {
              // AI 开始说话，先完成用户输入
              if (currentInputTranscriptRef.current) {
                updateTranscript('user', currentInputTranscriptRef.current, false);
                currentInputTranscriptRef.current = '';
              }

              const ctx = audioContextRef.current;
              if (ctx.state === 'suspended') await ctx.resume();

              if (nextStartTimeRef.current < ctx.currentTime) {
                nextStartTimeRef.current = ctx.currentTime;
              }

              try {
                const buffer = await decodeAudioData(base64ToBytes(audioData), ctx, 24000);
                const source = ctx.createBufferSource();
                source.buffer = buffer;

                // Connect AI Audio to Speakers
                source.connect(ctx.destination);

                // Connect AI Audio to Recorder (if active)
                if (recordingDestRef.current) {
                  source.connect(recordingDestRef.current);
                }

                // 计算音频开始播放的延迟时间
                const audioStartDelay = Math.max(0, (nextStartTimeRef.current - ctx.currentTime) * 1000);

                // 在音频开始播放时同步显示文本
                setTimeout(() => {
                  if (currentOutputTranscriptRef.current) {
                    updateTranscript('model', currentOutputTranscriptRef.current, true);
                  }
                }, audioStartDelay);

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
              } catch (e) {
                console.error("Audio decode error", e);
              }
            }

            // 3. Turn Complete
            if (msg.serverContent?.turnComplete) {
              if (currentOutputTranscriptRef.current) {
                updateTranscript('model', currentOutputTranscriptRef.current, false);
                currentOutputTranscriptRef.current = '';
              }
              // 确保用户输入也被完成
              if (currentInputTranscriptRef.current) {
                updateTranscript('user', currentInputTranscriptRef.current, false);
                currentInputTranscriptRef.current = '';
              }
            }
          },
          onclose: () => {
            console.log("Session closed");
            finalizeRecording();
            setAppState(AppState.ENDED);
          },
          onerror: (err) => {
            console.error("Session error", err);
            finalizeRecording();
            setAppState(AppState.ERROR);
          }
        }
      });

    } catch (error) {
      console.error("Connection failed", error);
      finalizeRecording();
      setAppState(AppState.ERROR);
    }
  }, []);

  const finalizeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Small delay to ensure last chunk is pushed
    setTimeout(() => {
      if (audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        recordedAudioBlobRef.current = blob;
      }
    }, 100);
  };

  const updateTranscript = (role: 'user' | 'model', text: string, isPartial: boolean) => {
    setTranscripts(prev => {
      const last = prev[prev.length - 1];

      // 如果最后一条是同角色且是部分消息，更新它
      if (last && last.role === role && last.isPartial) {
        const updated = { ...last, text, isPartial };
        return [...prev.slice(0, -1), updated];
      }

      // 如果最后一条是同角色、同内容且都是最终消息，不重复添加
      if (last && last.role === role && !last.isPartial && !isPartial && last.text === text) {
        return prev;
      }

      // 忽略空的最终消息
      if (!isPartial && !text.trim()) return prev;

      return [...prev, {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role,
        text,
        isPartial,
        timestamp: Date.now()
      }];
    });
  };

  const disconnect = useCallback(() => {
    // 清空所有转录缓存，防止残留
    currentOutputTranscriptRef.current = '';
    currentInputTranscriptRef.current = '';

    cleanupAudio();
    finalizeRecording();
    setAppState(AppState.ENDED);
  }, [cleanupAudio]);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    currentOutputTranscriptRef.current = '';
    currentInputTranscriptRef.current = '';
  }, []);

  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  const getAudioBlob = useCallback(() => {
    return recordedAudioBlobRef.current;
  }, []);

  return {
    connect,
    disconnect,
    appState,
    transcripts,
    volumeLevel,
    getAudioBlob,
    clearTranscripts
  };
};
