
import { GoogleGenAI, Type } from '@google/genai';
import { TranscriptItem, AnalysisResult, CorrectionItem } from '../types';

export const MOCK_SAMPLE_RESULT: AnalysisResult = {
  id: 'sample-session-001',
  date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
  overallScore: 4.0,
  fluencyScore: 4.0,
  lexicalScore: 4.5,
  grammarScore: 4.0,
  pronunciationScore: 4.0,
  
  speechMetrics: {
    prosodyScore: 45,
    pronunciationScore: 50,
    fluencyScore: 42,
    completenessScore: 80,
    feedback: "The speaker tends to speak in a monotone range with limited pitch variation, which makes the delivery sound somewhat robotic. There is noticeable stress on incorrect syllables in multi-syllabic words. However, the speaker generally finishes their sentences, showing good thought completeness despite the delivery issues."
  },

  flowFeedback: "There is a significant reliance on filler words like 'um' and 'uh' to buy thinking time, which disrupts the natural rhythm of speech. The speaker often pauses in the middle of phrases rather than at natural clause boundaries, indicating a struggle to access vocabulary quickly.",

  hesitations: [
    { word: "um", count: 15 },
    { word: "uh", count: 12 },
    { word: "like", count: 7 },
    { word: "the", count: 7 },
    { word: "and", count: 7 },
    { word: "you", count: 7 },
    { word: "it", count: 7 },
    { word: "is", count: 7 },
    { word: "a", count: 7 },
    { word: "my", count: 7 },
    { word: "to", count: 7 },
    { word: "of", count: 7 },
    { word: "what", count: 4 },
    { word: "her", count: 2 },
    { word: "because", count: 3 },
    { word: "but", count: 2 },
    { word: "i", count: 7 },
    { word: "me", count: 3 },
    { word: "was", count: 4 },
    { word: "has", count: 2 },
    { word: "very", count: 3 },
    { word: "now", count: 2 },
    { word: "come", count: 3 },
    { word: "talk", count: 2 },
    { word: "who", count: 2 },
    { word: "based", count: 2 }
  ],
  vocabularyIssues: [
    {
      original: "desert skin",
      correction: "desert landscape",
      type: "Word Choice",
      explanation: "Original phrase 'desert skin' is unclear. 'Landscape' is the correct term for natural scenery."
    },
    {
      original: "creative animals",
      correction: "unique animals",
      type: "Word Choice",
      explanation: "Animals aren't typically described as 'creative' in this context. 'Unique' or 'native' fits better."
    },
    {
      original: "a manaus my nose",
      correction: "makes my nose dry",
      type: "Unclear Phrase",
      explanation: "This appears to be a mispronunciation or confusion. 'Makes my nose dry' fits the context of dry weather."
    },
    {
      original: "felt the folding",
      correction: "local food",
      type: "Word Choice",
      explanation: "Likely meant 'food'. 'Local food' is a standard collocation."
    }
  ],
  grammarIssues: [
    {
      original: "the south waste of chinese",
      correction: "in the southwest of China",
      type: "Preposition/Article",
      explanation: "Incorrect directional phrase. Use 'in the southwest of China'."
    },
    {
      original: "a has a beautiful desert skin",
      correction: "and it has a beautiful desert landscape",
      type: "Subject-Verb Agreement",
      explanation: "Missing subject 'it'. 'Skin' is incorrect contextually."
    },
    {
      original: "and sometimes of a little built",
      correction: "and sometimes there are a few buildings",
      type: "Sentence Fragment",
      explanation: "The sentence is incomplete and lacks a clear subject-verb structure."
    }
  ],
  advancedVocabulary: ["unique", "genuine", "fosters", "interactions", "enrich"],
  improvements: [
    "Increase fluency by reducing hesitation markers (um, uh). Practice speaking in full thoughts.",
    "Improve lexical resource by learning topic-specific vocabulary for Geography and Culture.",
    "Focus on Subject-Verb agreement and sentence structure reliability.",
    "Work on pronunciation of distinct consonant clusters to avoid confusion like 'folding' vs 'food'."
  ]
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: "IELTS Band Score 0-9" },
    fluencyScore: { type: Type.NUMBER, description: "Fluency & Coherence Band 0-9" },
    lexicalScore: { type: Type.NUMBER, description: "Lexical Resource Band 0-9" },
    grammarScore: { type: Type.NUMBER, description: "Grammar Range Band 0-9" },
    pronunciationScore: { type: Type.NUMBER, description: "Pronunciation Band 0-9" },
    
    // NEW Speech Metrics
    speechMetrics: {
      type: Type.OBJECT,
      properties: {
        prosodyScore: { type: Type.NUMBER, description: "Score 0-100 for intonation, stress, and rhythm." },
        pronunciationScore: { type: Type.NUMBER, description: "Score 0-100 for phonemic accuracy." },
        fluencyScore: { type: Type.NUMBER, description: "Score 0-100 for speed and silence ratios." },
        completenessScore: { type: Type.NUMBER, description: "Score 0-100 for how complete the thoughts were." },
        feedback: { type: Type.STRING, description: "A paragraph evaluating the speaker's intonation, accent, and naturalness based on the audio." }
      },
      required: ["prosodyScore", "pronunciationScore", "fluencyScore", "completenessScore", "feedback"]
    },

    flowFeedback: { type: Type.STRING, description: "A paragraph evaluating the speaker's hesitation patterns, use of fillers, and ability to self-correct." },

    hesitations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          count: { type: Type.NUMBER }
        }
      }
    },
    vocabularyIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          correction: { type: Type.STRING },
          type: { type: Type.STRING },
          explanation: { type: Type.STRING }
        }
      }
    },
    grammarIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          correction: { type: Type.STRING },
          type: { type: Type.STRING },
          explanation: { type: Type.STRING }
        }
      }
    },
    advancedVocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["overallScore", "fluencyScore", "lexicalScore", "grammarScore", "pronunciationScore", "speechMetrics", "flowFeedback", "hesitations", "vocabularyIssues", "grammarIssues", "advancedVocabulary", "improvements"]
};

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateAnalysisReport = async (transcripts: TranscriptItem[], apiKey: string, audioBlob?: Blob | null): Promise<AnalysisResult | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Convert transcript to string
    const transcriptText = transcripts.map(t => 
      `${t.role === 'user' ? 'Candidate' : 'Examiner'}: ${t.text}`
    ).join('\n');

    const parts: any[] = [
      { text: `Analyze the following IELTS Speaking session.
      
      Audio Evidence is provided. Use the audio to strictly evaluate Prosody, Pronunciation, Fluency, and Completeness.
      
      Transcript:
      ${transcriptText}
      
      Task:
      1. Provide IELTS Band Scores (0-9) for the 4 criteria.
      2. Provide detailed Speech Metrics (0-100) based on the AUDIO:
         - Prosody: Intonation, stress, rhythm.
         - Pronunciation: Phonemic accuracy.
         - Fluency: Smoothness, speed, pauses.
         - Completeness: Syntactic and semantic completeness.
         - Feedback: Qualitative assessment of intonation and accent.
      3. Provide a Flow Feedback summary: Evaluate hesitation markers and coherence.
      4. Identify hesitation markers (um, uh, like) and count them.
      5. List vocabulary and grammar errors with corrections.
      6. List advanced vocabulary used.
      7. Provide 4 actionable improvements.` 
      }
    ];

    // If audio exists, add it to the request
    if (audioBlob) {
      const audioBase64 = await blobToBase64(audioBlob);
      parts.push({
        inlineData: {
          mimeType: "audio/webm",
          data: audioBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(responseText);

    return {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      ...data
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
