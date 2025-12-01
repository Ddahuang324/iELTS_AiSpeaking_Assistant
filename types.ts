
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

export interface OptimizationSuggestion {
  category: string;           // 建议类别,如"语调练习"、"重音训练"、"连读技巧"
  specific_issue: string;     // 具体问题描述
  actionable_steps: string[]; // 可操作的改进步骤列表
  example?: string;           // 具体示例(可选)
}

export interface NativeAudioAnalysis {
  // 总体评分
  overall_scores: {
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
  };

  // 总体优化建议(结构化)
  optimization_suggestions: OptimizationSuggestion[];
}


export interface QuestionAnswerPair {
  examiner_question: string;        // 考官的问题（英文原文）
  candidate_answer_outline: string; // 考生回答的要点总结（中文）
  standard_response: string;        // AI 生成的标准高分回答（英文）
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
  standard_responses?: QuestionAnswerPair[]; // 可选字段，支持向后兼容
}

