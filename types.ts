
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

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';

export type DifficultyMode = 'beginner' | 'advanced';

// --- NEW ANALYSIS TYPES (Snake Case to match AI JSON) ---

export interface FeedbackPoint {
  point: string;
  example: string;
}

export interface OverallFeedback {
  strengths: FeedbackPoint[];
  areas_for_improvement: FeedbackPoint[];
  key_recommendations: FeedbackPoint[];
}

export interface BandScore {
  score: number;
  rationale: string;
}

export interface IeltsBandScores {
  fluency_and_coherence: BandScore;
  lexical_resource: BandScore;
  grammatical_range_and_accuracy: BandScore;
  pronunciation: BandScore;
  overall: BandScore;
}

export interface GrammarError {
  type: string;
  original_sentence: string;
  text: string;
  description: string;
  suggestions: string[];
}

export interface WordChoiceIssue {
  type: string;
  original_sentence: string;
  text: string;
  suggestion: string;
}

export interface VocabularySuggestion {
  overused_word: string;
  original_sentence: string;
  suggested_rewrites: string[];
}

export interface VocabularyAssessment {
  advanced_words_found: string[];
  vocabulary_suggestions: VocabularySuggestion[];
}

export interface HesitationMarker {
  marker: string;
  count: number;
}

export interface FluencyMarkers {
  analysis: string;
  hesitation_markers: HesitationMarker[];
  connectors_used: string[];
}

export interface PronunciationPattern {
  suspected_issue: string;
  evidence: string[];
}

export interface PronunciationAnalysis {
  analysis: string;
  potential_patterns: PronunciationPattern[];
}

export interface NativeAudioAnalysis {
  intonation: {
    score: number;
    analysis: string;
  };
  tone: {
    score: number;
    analysis: string;
  };
  spoken_vocabulary: {
    score: number;
    analysis: string;
  };
  detected_errors: {
    error: string;
    position_context: string;
    correction: string;
  }[];
  optimization_suggestions: string[];
}

export interface AnalysisResult {
  id: string;
  date: string;

  overall_feedback: OverallFeedback;
  ielts_band_score: IeltsBandScores;
  grammar_errors: GrammarError[];
  word_choice_issues: WordChoiceIssue[];
  vocabulary_assessment: VocabularyAssessment;
  fluency_markers: FluencyMarkers;
  pronunciation_analysis: PronunciationAnalysis;
  native_audio_analysis: NativeAudioAnalysis;
}
