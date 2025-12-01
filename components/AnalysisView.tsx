
import React, { useState } from 'react';
import { TranscriptItem, AnalysisResult, GrammarError, WordChoiceIssue, VocabularySuggestion, QuestionAnswerPair, OptimizationSuggestion } from '../types';
import { MOCK_SAMPLE_RESULT } from '../services/analysisService';

interface AnalysisViewProps {
   transcripts: TranscriptItem[];
   history: AnalysisResult[];
   isAnalyzing: boolean;
   onAnalyze: () => void;
   onDelete: (id: string) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ transcripts, history, isAnalyzing, onAnalyze, onDelete }) => {
   const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);

   // --- RENDER: DETAIL VIEW ---
   if (selectedResult) {
      return (
         <div className="w-full h-full overflow-y-auto bg-white animate-fade-in">
            <div className="max-w-5xl mx-auto p-6 md:p-12 pb-32">

               {/* Header Navigation */}
               <div className="flex items-center gap-4 mb-8">
                  <button
                     onClick={() => setSelectedResult(null)}
                     className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 hover:text-charcoal transition-colors group"
                  >
                     <span className="group-hover:-translate-x-1 transition-transform">←</span>
                     Back to History
                  </button>
               </div>

               <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 border-b border-gray-100 pb-6 gap-6">
                  <div>
                     <h2 className="text-3xl md:text-4xl font-thin text-charcoal">Analysis <span className="font-medium text-accent-teal">Report</span></h2>
                     <p className="text-xs text-gray-400 uppercase tracking-widest mt-2">
                        {new Date(selectedResult.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                     </p>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                        ID: {selectedResult.id.slice(-6)}
                     </span>
                  </div>
               </header>

               <ReportContent result={selectedResult} />
            </div>
         </div>
      );
   }

   // --- RENDER: HISTORY DASHBOARD ---
   return (
      <div className="w-full h-full overflow-y-auto bg-white">
         <div className="max-w-5xl mx-auto p-6 md:p-12 pb-32">

            <header className="mb-12 border-b border-gray-100 pb-6">
               <h2 className="text-3xl md:text-4xl font-thin text-charcoal">Session <span className="font-medium text-accent-teal">History</span></h2>
               <p className="text-xs text-gray-400 uppercase tracking-widest mt-2">Past Performance & Diagnostics</p>
            </header>

            <div className="grid grid-cols-1 gap-8">

               {/* Current Session Card (If data exists) */}
               {transcripts.length > 2 && (
                  <div className="bg-charcoal text-white rounded-2xl p-8 shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-700">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" /></svg>
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-xl font-light mb-2">Current Session Ready</h3>
                        <p className="text-gray-400 text-sm mb-6 max-w-md">
                           You have {transcripts.length} dialogue turns recorded. Generate a new diagnostic report to see your performance.
                        </p>
                        <button
                           onClick={onAnalyze}
                           disabled={isAnalyzing}
                           className="px-8 py-3 bg-white text-charcoal text-xs uppercase tracking-widest rounded-full hover:bg-accent-teal hover:text-white transition-all shadow-lg"
                        >
                           {isAnalyzing ? 'Analyzing...' : 'Generate Analysis'}
                        </button>
                     </div>
                     {isAnalyzing && (
                        <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm flex items-center justify-center z-20">
                           <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                     )}
                  </div>
               )}

               {/* History List */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((item) => (
                     <HistoryCard
                        key={item.id}
                        item={item}
                        onClick={() => setSelectedResult(item)}
                        onDelete={() => onDelete(item.id)}
                        isSample={item.id === MOCK_SAMPLE_RESULT.id}
                     />
                  ))}
               </div>

               {history.length === 0 && transcripts.length <= 2 && (
                  <div className="text-center py-24 border-2 border-dashed border-gray-100 rounded-2xl">
                     <p className="text-gray-300 text-sm">No analysis history found.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

// --- SUBCOMPONENTS ---

const ReportContent: React.FC<{ result: AnalysisResult }> = ({ result }) => {
   const [isVocabularyExpanded, setIsVocabularyExpanded] = useState(true);
   const [isGrammarExpanded, setIsGrammarExpanded] = useState(true);

   return (
      <div className="space-y-16 animate-float-in">

         {/* 1. SCORE DASHBOARD */}
         <section>
            <SectionHeader icon="🏆" title="Overall Assessment" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="md:col-span-1 bg-charcoal text-white rounded-2xl p-6 flex flex-col justify-between aspect-square relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                     <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                  </div>
                  <span className="text-xs uppercase tracking-widest opacity-60">IELTS Band</span>
                  <span className="text-6xl font-bold">{result.ielts_band_score.overall.score}</span>
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                     <div className="h-full bg-accent-gold" style={{ width: `${(result.ielts_band_score.overall.score / 9) * 100}%` }}></div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 line-clamp-2">{result.ielts_band_score.overall.rationale}</p>
               </div>

               <ScoreCard title="Fluency & Coherence" score={result.ielts_band_score.fluency_and_coherence.score} rationale={result.ielts_band_score.fluency_and_coherence.rationale} color="text-blue-500" />
               <ScoreCard title="Lexical Resource" score={result.ielts_band_score.lexical_resource.score} rationale={result.ielts_band_score.lexical_resource.rationale} color="text-green-500" />
               <div className="flex flex-col gap-4 md:col-span-1">
                  <ScoreCardSmall title="Grammar" score={result.ielts_band_score.grammatical_range_and_accuracy.score} />
                  <ScoreCardSmall title="Pronunciation" score={result.ielts_band_score.pronunciation.score} />
               </div>
            </div>
         </section>

         {/* 2. OVERALL FEEDBACK */}
         <section>
            <SectionHeader icon="📝" title="Comprehensive Feedback" />
            <div className="flex flex-col gap-6">
               <FeedbackColumn title="Strengths" items={result.overall_feedback.strengths} color="bg-green-50 border-green-100 text-green-800" />
               <FeedbackColumn title="Improvements" items={result.overall_feedback.areas_for_improvement} color="bg-orange-50 border-orange-100 text-orange-800" />
               <FeedbackColumn title="Recommendations" items={result.overall_feedback.key_recommendations} color="bg-blue-50 border-blue-100 text-blue-800" />
            </div>
         </section>

         {/* 3. FLUENCY & PRONUNCIATION */}
         <section>
            <SectionHeader icon="🌊" title="Fluency & Pronunciation" />
            <div className="grid md:grid-cols-2 gap-8">
               {/* Fluency */}
               <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-4">Fluency Analysis</h4>
                  <p className="text-sm text-gray-600 mb-6 italic">"{result.fluency_markers.analysis}"</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                     {result.fluency_markers.hesitation_markers.map((h, i) => (
                        <div key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs flex items-center gap-2 border border-red-100">
                           <span className="font-serif italic">{h.marker}</span>
                           <span className="font-bold bg-white px-1.5 rounded-full text-[10px]">{h.count}</span>
                        </div>
                     ))}
                  </div>
                  <div className="text-xs text-gray-400">
                     Connectors used: <span className="text-charcoal">{result.fluency_markers.connectors_used.join(", ")}</span>
                  </div>
               </div>

               {/* Pronunciation */}
               <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-4">Pronunciation Analysis</h4>
                  <p className="text-sm text-gray-600 mb-6 italic">"{result.pronunciation_analysis.analysis}"</p>

                  {result.pronunciation_analysis.potential_patterns.length > 0 ? (
                     <ul className="space-y-3">
                        {result.pronunciation_analysis.potential_patterns.map((p, i) => (
                           <li key={i} className="text-xs bg-gray-50 p-3 rounded-lg">
                              <strong className="block text-charcoal mb-1">{p.suspected_issue}</strong>
                              <span className="text-gray-500">Evidence: {p.evidence.join(", ")}</span>
                           </li>
                        ))}
                     </ul>
                  ) : (
                     <p className="text-xs text-gray-400">No specific pronunciation patterns detected.</p>
                  )}
               </div>
            </div>
         </section>

         {/* 4. NATIVE AUDIO ANALYSIS (NEW SECTION) */}
         {result.native_audio_analysis && (
            <section>
               <SectionHeader icon="🎙️" title="Native Audio Analysis" />
               <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-8 shadow-xl">
                  {/* 总体评分 */}
                  <div className="grid md:grid-cols-3 gap-8 mb-8">
                     <AudioMetricCircle
                        label="Intonation"
                        score={result.native_audio_analysis.overall_scores.intonation.score}
                        description={result.native_audio_analysis.overall_scores.intonation.analysis}
                     />
                     <AudioMetricCircle
                        label="Tone"
                        score={result.native_audio_analysis.overall_scores.tone.score}
                        description={result.native_audio_analysis.overall_scores.tone.analysis}
                     />
                     <AudioMetricCircle
                        label="Spoken Vocab"
                        score={result.native_audio_analysis.overall_scores.spoken_vocabulary.score}
                        description={result.native_audio_analysis.overall_scores.spoken_vocabulary.analysis}
                     />
                  </div>

                  {/* 优化建议 */}
                  {result.native_audio_analysis.optimization_suggestions && result.native_audio_analysis.optimization_suggestions.length > 0 && (
                     <div className="border-t border-white/10 pt-8">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-teal-300 mb-6">🎯 优化建议与练习方法</h4>
                        <div className="space-y-4">
                           {result.native_audio_analysis.optimization_suggestions.map((suggestion, i) => (
                              <OptimizationSuggestionCard key={i} suggestion={suggestion} index={i} />
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </section>
         )}

         {/* 6. STANDARD RESPONSES */}
         {result.standard_responses && result.standard_responses.length > 0 && (
            <section>
               <SectionHeader icon="💬" title="规范回答" />
               <div className="space-y-6">
                  {result.standard_responses.map((qa, i) => (
                     <StandardResponseCard key={i} item={qa} index={i} />
                  ))}
               </div>
            </section>
         )}


         {/* 5. VOCABULARY ASSESSMENT */}
         <section>
            <CollapsibleSectionHeader
               icon="📖"
               title="Vocabulary Assessment"
               isExpanded={isVocabularyExpanded}
               onToggle={() => setIsVocabularyExpanded(!isVocabularyExpanded)}
            />

            {isVocabularyExpanded && (
               <>
                  {/* Advanced Words */}
                  <div className="mb-8">
                     <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Advanced Vocabulary Used</h4>
                     <div className="flex flex-wrap gap-2">
                        {result.vocabulary_assessment.advanced_words_found.map((word, i) => (
                           <span key={i} className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium uppercase tracking-wider rounded-md border border-teal-100">
                              {word}
                           </span>
                        ))}
                     </div>
                  </div>

                  {/* Word Choice Issues */}
                  <div className="grid grid-cols-1 gap-6 mb-8">
                     {result.word_choice_issues.map((issue, i) => (
                        <WordChoiceCard key={i} item={issue} />
                     ))}
                  </div>

                  {/* Suggestions */}
                  {result.vocabulary_assessment.vocabulary_suggestions.length > 0 && (
                     <div className="bg-purple-50/50 rounded-2xl p-6 border border-purple-100">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-purple-800 mb-4">Vocabulary Upgrades</h4>
                        <div className="grid gap-4">
                           {result.vocabulary_assessment.vocabulary_suggestions.map((sugg, i) => (
                              <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
                                 <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-gray-400 uppercase">Overused:</span>
                                    <span className="text-sm font-bold text-charcoal line-through decoration-red-400">{sugg.overused_word}</span>
                                 </div>
                                 <p className="text-sm text-gray-600 mb-2 italic">"{sugg.original_sentence}"</p>
                                 <div className="flex flex-col gap-1">
                                    {sugg.suggested_rewrites.map((rewrite, j) => (
                                       <div key={j} className="flex items-start gap-2 text-sm text-purple-700">
                                          <span>✨</span>
                                          <span>{rewrite}</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </>
            )}
         </section>

         {/* 5. GRAMMAR ERRORS */}
         <section>
            <CollapsibleSectionHeader
               icon="⚠️"
               title={`Grammar Errors (${result.grammar_errors.length})`}
               isExpanded={isGrammarExpanded}
               onToggle={() => setIsGrammarExpanded(!isGrammarExpanded)}
            />
            {isGrammarExpanded && (
               <div className="grid grid-cols-1 gap-6">
                  {result.grammar_errors.map((error, i) => (
                     <GrammarErrorCard key={i} item={error} />
                  ))}
               </div>
            )}
         </section>
      </div>
   );
};

const HistoryCard: React.FC<{ item: AnalysisResult; onClick: () => void; onDelete?: () => void; isSample?: boolean }> = ({ item, onClick, onDelete, isSample }) => {
   const hesitationCount = item.fluency_markers.hesitation_markers.reduce((acc, curr) => acc + curr.count, 0);

   return (
      <div
         role="button"
         tabIndex={0}
         onClick={onClick}
         onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
               e.preventDefault();
               onClick();
            }
         }}
         className="group flex flex-col items-start bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-gray-200 transition-all duration-300 text-left relative overflow-hidden w-full"
      >
         {isSample && (
            <div className="absolute top-0 right-0 bg-accent-gold text-white text-[9px] uppercase font-bold tracking-widest px-3 py-1 rounded-bl-xl">
               Sample
            </div>
         )}

         {/* Delete button (hidden for sample). Visible on hover. */}
         {!isSample && onDelete && (
            <button
               onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete();
               }}
               aria-label="Delete history"
               className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 text-red-500 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-opacity shadow"
            >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.9a1 1 0 0 0 1.41-1.41L13.41 12l4.9-4.89a1 1 0 0 0 0-1.4z" />
               </svg>
            </button>
         )}

         <div className="mb-4">
            <span className="text-4xl font-bold text-charcoal group-hover:text-accent-teal transition-colors">
               {item.ielts_band_score.overall.score}
            </span>
            <span className="text-sm text-gray-300 ml-1">/9</span>
         </div>

         <div className="space-y-1 mb-6 w-full">
            <div className="flex justify-between text-xs text-gray-500">
               <span>Fluency</span>
               <span className="font-medium">{item.ielts_band_score.fluency_and_coherence.score}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
               <span>Pronunciation</span>
               <span className="font-medium">{item.ielts_band_score.pronunciation.score}</span>
            </div>
            <div className="w-full h-px bg-gray-50 my-1"></div>
            <div className="text-[10px] text-red-400 font-medium">
               {hesitationCount} Hesitations
            </div>
         </div>

         <div className="mt-auto pt-4 w-full border-t border-gray-50 flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-widest text-gray-400">
               {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-accent-teal text-lg group-hover:translate-x-1 transition-transform">→</span>
         </div>
      </div>
   );
};

const SectionHeader: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
   <h3 className="flex items-center gap-3 text-lg font-medium text-charcoal mb-6">
      <span className="opacity-60 grayscale">{icon}</span>
      {title}
   </h3>
);

const CollapsibleSectionHeader: React.FC<{ icon: string; title: string; isExpanded: boolean; onToggle: () => void }> = ({ icon, title, isExpanded, onToggle }) => (
   <button
      onClick={onToggle}
      className="flex items-center justify-between w-full text-lg font-medium text-charcoal mb-6 hover:text-accent-teal transition-colors group cursor-pointer"
   >
      <div className="flex items-center gap-3">
         <span className="opacity-60 grayscale group-hover:opacity-100 transition-opacity">{icon}</span>
         <span>{title}</span>
      </div>
      <svg
         className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
         fill="none"
         stroke="currentColor"
         viewBox="0 0 24 24"
      >
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
   </button>
);

const ScoreCard: React.FC<{ title: string; score: number; rationale: string; color: string }> = ({ title, score, rationale, color }) => (
   <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-start mb-2">
         <span className="text-[10px] uppercase tracking-widest text-gray-400">{title}</span>
         <span className={`text-2xl font-bold ${color}`}>{score}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{rationale}</p>
   </div>
);

const ScoreCardSmall: React.FC<{ title: string; score: number }> = ({ title, score }) => (
   <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 flex items-center justify-between shadow-sm">
      <span className="text-[10px] uppercase tracking-widest text-gray-400">{title}</span>
      <span className="text-xl font-bold text-charcoal">{score}</span>
   </div>
);

const FeedbackColumn: React.FC<{ title: string; items: { point: string; example: string }[]; color: string }> = ({ title, items, color }) => (
   <div className={`rounded-xl p-6 border ${color} bg-opacity-50 h-full`}>
      <h4 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-80">{title}</h4>
      <ul className="space-y-4">
         {items.map((item, i) => (
            <li key={i} className="text-sm">
               <p className="font-medium mb-1">{item.point}</p>
               <p className="text-xs opacity-70 italic">"{item.example}"</p>
            </li>
         ))}
      </ul>
   </div>
);

const WordChoiceCard: React.FC<{ item: WordChoiceIssue }> = ({ item }) => (
   <div className="group bg-white rounded-xl border border-gray-100 hover:border-gray-300 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
      <div className="flex flex-col md:flex-row">
         <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-r border-gray-50 bg-red-50/10">
            <div className="flex justify-between items-start mb-2">
               <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-red-100 text-red-600">
                  {item.type}
               </span>
            </div>
            <p className="font-serif text-lg text-charcoal/80 mb-1">"{item.text}"</p>
            <p className="text-xs text-gray-400 italic mb-2">in: "{item.original_sentence}"</p>
         </div>

         <div className="p-6 md:w-1/2 bg-white flex flex-col justify-center">
            <p className="text-sm text-accent-teal font-medium bg-teal-50 inline-block px-2 py-1 rounded mb-1 self-start">
               Better: {item.suggestion}
            </p>
         </div>
      </div>
   </div>
);

const GrammarErrorCard: React.FC<{ item: GrammarError }> = ({ item }) => (
   <div className="group bg-white rounded-xl border border-gray-100 hover:border-gray-300 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
      <div className="p-6">
         <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-orange-100 text-orange-600">
               {item.type}
            </span>
            <span className="text-xs text-gray-400">{item.description}</span>
         </div>

         <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-red-50/30 rounded-lg">
               <p className="text-xs text-red-400 uppercase tracking-wide mb-1">Original</p>
               <p className="font-serif text-charcoal/80">"{item.original_sentence}"</p>
               <p className="text-xs text-red-500 mt-2 font-bold">Error: {item.text}</p>
            </div>

            <div className="p-4 bg-green-50/30 rounded-lg">
               <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Suggestion</p>
               <ul className="space-y-1">
                  {item.suggestions.map((s, i) => (
                     <li key={i} className="font-medium text-charcoal">"{s}"</li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
   </div>
);

const OptimizationSuggestionCard: React.FC<{ suggestion: OptimizationSuggestion; index: number }> = ({ suggestion, index }) => (
   <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
      {/* 类别标签 */}
      <div className="flex items-center gap-3 mb-4">
         <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
            {suggestion.category}
         </span>
      </div>

      {/* 具体问题 */}
      <div className="mb-4">
         <h5 className="text-xs font-bold text-red-300 uppercase mb-2">🎯 具体问题</h5>
         <p className="text-sm text-white leading-relaxed">{suggestion.specific_issue}</p>
      </div>

      {/* 可操作步骤 */}
      <div className="mb-4">
         <h5 className="text-xs font-bold text-blue-300 uppercase mb-3">💡 改进步骤</h5>
         <ol className="space-y-2">
            {suggestion.actionable_steps.map((step, i) => (
               <li key={i} className="flex gap-3 text-sm text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">
                     {i + 1}
                  </span>
                  <span className="flex-1">{step}</span>
               </li>
            ))}
         </ol>
      </div>

      {/* 示例 */}
      {suggestion.example && (
         <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h5 className="text-xs font-bold text-green-300 uppercase mb-2">✨ 练习示例</h5>
            <p className="text-sm text-green-100 leading-relaxed">{suggestion.example}</p>
         </div>
      )}
   </div>
);

export default AnalysisView;


const StandardResponseCard: React.FC<{ item: QuestionAnswerPair; index: number }> = ({ item, index }) => (
   <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
         问答 #{index + 1}
      </h4>

      {/* 考官问题 - 左侧气泡 */}
      <div className="flex justify-start mb-4">
         <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[80%] border border-gray-200">
            <p className="text-xs text-gray-400 uppercase mb-1">Examiner</p>
            <p className="text-sm text-charcoal font-medium">{item.examiner_question}</p>
         </div>
      </div>

      {/* 考生回答要点 - 右侧气泡 */}
      <div className="flex justify-end mb-4">
         <div className="bg-blue-500 text-white rounded-2xl rounded-tr-none p-4 shadow-sm max-w-[80%]">
            <p className="text-xs opacity-80 uppercase mb-1">你的回答要点</p>
            <p className="text-sm">{item.candidate_answer_outline}</p>
         </div>
      </div>

      {/* 标准回答 - 高亮展示 */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl p-6 shadow-lg">
         <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">✨</span>
            <p className="text-xs font-bold uppercase tracking-widest">标准高分回答</p>
         </div>
         <p className="text-base leading-relaxed font-medium">{item.standard_response}</p>
      </div>
   </div>
);

const AudioMetricCircle: React.FC<{ label: string; score: number; description: string }> = ({ label, score, description }) => (

   <div className="flex flex-col items-center text-center">
      <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
         <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="8" />
            <circle
               cx="50" cy="50" r="45" fill="none" stroke={score > 70 ? "#4ade80" : score > 50 ? "#facc15" : "#f87171"}
               strokeWidth="8"
               strokeDasharray={`${(score / 100) * 283} 283`}
               strokeLinecap="round"
            />
         </svg>
         <span className="text-2xl font-bold">{score}</span>
      </div>
      <h5 className="text-xs font-bold uppercase tracking-widest mb-2">{label}</h5>
      <p className="text-[10px] text-gray-400 leading-relaxed">{description}</p>
   </div>
);
