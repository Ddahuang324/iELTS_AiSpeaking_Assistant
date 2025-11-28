
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { base64ToBytes, decodeAudioData, resampleTo16kHZ, bytesToBase64, float32ToInt16 } from '../services/audioUtils';
import { TranscriptItem, AppState, VoiceName } from '../types';

const SYSTEM_INSTRUCTION = `You are a professional, encouraging, yet neutral IELTS Speaking Examiner.
Your goal is to help the candidate practice by asking questions from IELTS Speaking Part 1, Part 2, and Part 3 in a random and dynamic manner.
1. Do NOT follow a strict exam structure (Part 1 -> Part 2 -> Part 3). Instead, randomly select questions from any of the three parts to test the candidate's adaptability.
2. Avoid any fixed paradigms or repetitive scripts. Be unpredictable but relevant.
3. Start by briefly introducing yourself and asking for the candidate's name, then immediately ask a question from Part 1, Part 2, or Part 3.
4. Keep your responses concise (spoken style) and clear.
5. Listen carefully to the user's answers. ALWAYS provide a brief, natural transitional comment or acknowledgment of what they said (e.g., "That's interesting," "I see," "Fair enough") before asking the next question. This makes the conversation flow naturally.
6. If they answer well, challenge them with a harder question (Part 3 style). If they struggle, switch to an easier topic (Part 1 style).
7. If the user stops speaking, gently prompt them or move to the next question.
8. Provide brief encouraging remarks but maintain examiner distance.
`;

// WORKLET_CODE: 音频 worklet 的字符串定义（修复可能的拼写/语法问题）
const WORKLET_CODE = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(4096);
    this.bufferIndex = 0;
    this.targetSampleRate = 16000;
    this.chunkSize = 1024; // ~64ms at 16kHz
    this._ratioComputed = false;
    this._ratio = 1;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input.length) return true;
    const channelData = input[0];

    // @ts-ignore
    const currentSampleRate = sampleRate;

    // If sample rates match, just copy samples (fast path)
    if (currentSampleRate === this.targetSampleRate) {
      for (let i = 0; i < channelData.length; i++) {
        if (this.bufferIndex < this.buffer.length) {
          this.buffer[this.bufferIndex++] = channelData[i];
        }
        if (this.bufferIndex >= this.chunkSize) {
          this.port.postMessage(this.buffer.slice(0, this.chunkSize));
          this.bufferIndex = 0;
        }
      }
      return true;
    }

    // Only compute ratio when necessary
    if (!this._ratioComputed) {
      this._ratio = currentSampleRate / this.targetSampleRate;
      this._ratioComputed = true;
    }

    const ratio = this._ratio;
    const newLength = Math.floor(channelData.length / ratio);

    for (let i = 0; i < newLength; i++) {
      const originalIndex = i * ratio;
      const index1 = Math.floor(originalIndex);
      const index2 = Math.min(Math.ceil(originalIndex), channelData.length - 1);
      const weight = originalIndex - index1;
      const val = channelData[index1] * (1 - weight) + channelData[index2] * weight;

      if (this.bufferIndex < this.buffer.length) {
        this.buffer[this.bufferIndex++] = val;
      }

      if (this.bufferIndex >= this.chunkSize) {
        const chunk = this.buffer.slice(0, this.chunkSize);
        this.port.postMessage(chunk);
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}
registerProcessor('audio-processor', AudioProcessor);
`;

export const useGeminiLive = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sessionRef = useRef<any>(null);
  const isConnectedRef = useRef<boolean>(false);
  const currentOutputTranscriptRef = useRef<string>('');
  const currentInputTranscriptRef = useRef<string>('');

  // Throttle refs for volume updates and AI speaking flag
  const lastVolumeUpdateRef = useRef<number>(0);
  const isAiSpeakingRef = useRef<boolean>(false);

  // Audio Recording Refs (Mixed Stream)
  const recordingDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioBlobRef = useRef<Blob | null>(null);

  // Track active AI audio sources for interruption
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const stopAiAudio = useCallback(() => {
    audioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    });
    audioSourcesRef.current = [];
    nextStartTimeRef.current = 0; // Reset timing
    isAiSpeakingRef.current = false;
  }, []);

  const cleanupAudio = useCallback(() => {
    stopAiAudio();

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop Recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, [stopAiAudio]);

  const connect = useCallback(async (apiKey: string, voiceName: VoiceName = 'Kore', userInitiated: boolean = false) => {
    // Prevent automatic (non-user-initiated) connections. Callers must pass `true`
    // when the connection is triggered by a user gesture (e.g. button click).
    if (!userInitiated) {
      console.warn('connect() blocked: requires user interaction to start session');
      return;
    }
    cleanupAudio(); // Ensure clean state before connecting

    try {
      console.log("Connecting with voice:", voiceName);
      setAppState(AppState.CONNECTING);
      setTranscripts([]); // Clear previous transcripts
      audioChunksRef.current = []; // Clear previous audio
      recordedAudioBlobRef.current = null;

      if (!apiKey) {
        throw new Error("API Key is required");
      }

      const ai = new GoogleGenAI({ apiKey });

      // Initialize Audio Context
      // Try to request 16000Hz so worklet/resampling can be avoided when supported
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      let ctx: AudioContext;
      try {
        ctx = new (AudioContextClass as any)({ sampleRate: 16000 });
      } catch (e) {
        // Some browsers ignore sampleRate request; fallback to default constructor
        ctx = new (AudioContextClass as any)();
      }
      audioContextRef.current = ctx;

      // Load AudioWorklet if available; otherwise we'll fall back to ScriptProcessor
      const hasAudioWorklet = !!(ctx.audioWorklet && (ctx.audioWorklet as any).addModule);
      if (hasAudioWorklet) {
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        await ctx.audioWorklet.addModule(workletUrl);
        URL.revokeObjectURL(workletUrl);
      } else {
        console.warn('AudioWorklet not supported in this environment. Falling back to ScriptProcessorNode.');
      }

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
          // @ts-ignore - voiceActivityDetection might not be in the type definition yet
          voiceActivityDetection: {
            voiceActivityTimeoutMs: 2000, // Wait 2s before deciding speech ended
            voiceActivityThreshold: 0.5,  // Sensitivity
          },
        },
        callbacks: {
          onopen: async () => {
            console.log("Session opened");
            setAppState(AppState.ACTIVE);

            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
            }

            if (!streamRef.current || !audioContextRef.current) return;

            // Process Mic Stream for Gemini Input (using AudioWorklet)
            const source = audioContextRef.current.createMediaStreamSource(streamRef.current);

            // Create worklet node if supported, otherwise create a ScriptProcessorNode fallback
            let workletNode: AudioWorkletNode | any;
            if (audioContextRef.current && (audioContextRef.current as any).audioWorklet && (audioContextRef.current as any).audioWorklet.addModule) {
              workletNode = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
            } else {
              // ScriptProcessorNode is deprecated but provides a usable fallback when AudioWorklet is unavailable
              const bufferSize = 1024;
              const sp = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);

              // Create a minimal port-like interface so the rest of the code can use port.onmessage
              (sp as any).port = {
                onmessage: null as any,
                postMessage: () => { }
              };

              sp.onaudioprocess = (ev: AudioProcessingEvent) => {
                try {
                  const input = ev.inputBuffer.getChannelData(0);
                  // Copy the input to avoid it being a view on a changing buffer
                  const copy = new Float32Array(input.length);
                  copy.set(input);
                  if ((sp as any).port.onmessage) {
                    (sp as any).port.onmessage({ data: copy });
                  }
                } catch (e) {
                  console.error('ScriptProcessor fallback error', e);
                }
              };

              workletNode = sp as any;
            }

            sourceRef.current = source;
            workletNodeRef.current = workletNode;

            workletNode.port.onmessage = (e) => {
              const float32Data = e.data as Float32Array;

              // If AI is currently speaking, skip processing to avoid echo and blocking
              if (isAiSpeakingRef.current) return;

              // Throttle UI updates for volume (max ~10fps)
              const now = Date.now();
              if (now - lastVolumeUpdateRef.current > 100) {
                let sum = 0;
                // sample every 4th value to reduce CPU
                for (let i = 0; i < float32Data.length; i += 4) {
                  sum += float32Data[i] * float32Data[i];
                }
                const rms = Math.sqrt(sum / (float32Data.length / 4));
                setVolumeLevel(rms);
                lastVolumeUpdateRef.current = now;
              }

              // Convert and send audio chunk (this is heavier; throttling UI above reduces main-thread churn)
              try {
                const int16Data = float32ToInt16(float32Data);
                const base64Data = bytesToBase64(new Uint8Array(int16Data.buffer));

                if (sessionPromiseRef.current) {
                  sessionPromiseRef.current.then(session => {
                    try {
                      session.sendRealtimeInput({
                        media: {
                          mimeType: 'audio/pcm;rate=16000',
                          data: base64Data
                        }
                      });
                      // console.debug('Audio chunk sent, bytes=', base64Data.length);
                    } catch (err) {
                      console.error('Failed to send audio chunk:', err);
                    }
                  }).catch(err => console.error('Session promise rejected:', err));
                }
              } catch (err) {
                console.error('Audio processing error in onmessage:', err);
              }
            };

            source.connect(workletNode);
            // Worklet doesn't need to connect to destination unless we want self-monitoring (we don't)
            // workletNode.connect(audioContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // 1. 处理转录文本（先收集，稍后同步显示）
            const outputTranscript = msg.serverContent?.outputTranscription?.text;
            if (outputTranscript) {
              currentOutputTranscriptRef.current += outputTranscript;
            }

            const inputTranscript = msg.serverContent?.inputTranscription?.text;
            if (inputTranscript) {
              // User started speaking, interrupt AI if needed
              if (audioSourcesRef.current.length > 0) {
                stopAiAudio();
              }

              // Always update user input to show responsiveness
              currentInputTranscriptRef.current += inputTranscript;
              updateTranscript('user', currentInputTranscriptRef.current, true);
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

              // Reset timing if we are starting fresh or if time drifted significantly
              if (nextStartTimeRef.current < ctx.currentTime) {
                nextStartTimeRef.current = ctx.currentTime;
              }

              try {
                // Mark that AI is speaking to suppress mic processing temporarily
                isAiSpeakingRef.current = true;

                const buffer = await decodeAudioData(base64ToBytes(audioData), ctx, 24000);
                const source = ctx.createBufferSource();
                source.buffer = buffer;

                // Track source for interruption
                audioSourcesRef.current.push(source);
                source.onended = () => {
                  audioSourcesRef.current = audioSourcesRef.current.filter(s => s !== source);
                  // If no more AI sources, clear speaking flag
                  isAiSpeakingRef.current = audioSourcesRef.current.length > 0;
                };

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
              console.log("Turn Complete");
              // Force finalize transcripts
              if (currentOutputTranscriptRef.current) {
                updateTranscript('model', currentOutputTranscriptRef.current, false);
                currentOutputTranscriptRef.current = '';
              }
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
  }, [cleanupAudio, stopAiAudio]);

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
        if (last.text === text && last.isPartial === isPartial) return prev;
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

    // Stop audio and close contexts
    cleanupAudio();

    // Finalize any pending recording and then clear buffers
    finalizeRecording();

    setAppState(AppState.ENDED);
  }, [cleanupAudio]);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    currentOutputTranscriptRef.current = '';
    currentInputTranscriptRef.current = '';

    // Clear any recorded audio buffers so getAudioBlob() returns null/empty
    audioChunksRef.current = [];
    recordedAudioBlobRef.current = null;

    // If the session has already ended, reset app state to IDLE and ensure audio resources cleaned up.
    // This makes "Clear Chat" act as a refresh after Stop Session.
    if (appState === AppState.ENDED) {
      try {
        cleanupAudio();
      } catch (e) {
        // ignore cleanup errors
      }
      setAppState(AppState.IDLE);
    }
  }, [appState, cleanupAudio]);

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

