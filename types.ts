
export interface TranscriptItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  isPartial: boolean;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  ERROR = 'ERROR'
}

export interface AudioConfig {
  sampleRate: number;
}

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';

export type DifficultyMode = 'beginner' | 'advanced';

export interface CorrectionItem {
  original: string;
  correction: string;
  type: string; // e.g., "Word Choice", "Grammar", "Pronunciation"
  explanation: string;
}

export interface SpeechMetrics {
  prosodyScore: number;       // 0-100: Intonation, stress, rhythm
  pronunciationScore: number; // 0-100: Phonemic accuracy
  fluencyScore: number;       // 0-100: Speed, silence, hesitation
  completenessScore: number;  // 0-100: Did you finish the thought?
  feedback: string;           // Qualitative assessment of the audio
}

export interface AnalysisResult {
  id: string;   // Unique ID for history
  date: string; // ISO Date string
  overallScore: number;
  
  // High-level IELTS Band Scores
  fluencyScore: number;
  lexicalScore: number;
  grammarScore: number;
  pronunciationScore: number;

  // Detailed Speech Analysis (Azure-style)
  speechMetrics: SpeechMetrics;
  
  // Qualitative Flow Analysis
  flowFeedback: string;

  hesitations: { word: string; count: number }[];
  vocabularyIssues: CorrectionItem[];
  grammarIssues: CorrectionItem[];
  advancedVocabulary: string[];
  improvements: string[];
}
