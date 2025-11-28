
import React, { useState } from 'react';
import { TranscriptItem, AnalysisResult, CorrectionItem } from '../types';
import { MOCK_SAMPLE_RESULT } from '../services/analysisService';

interface AnalysisViewProps {
  transcripts: TranscriptItem[];
  history: AnalysisResult[];
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ transcripts, history, isAnalyzing, onAnalyze }) => {
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
                   <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/></svg>
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

const ReportContent: React.FC<{ result: AnalysisResult }> = ({ result }) => (
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
              <span className="text-6xl font-bold">{result.overallScore}</span>
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                 <div className="h-full bg-accent-gold" style={{ width: `${(result.overallScore / 9) * 100}%` }}></div>
              </div>
           </div>
           
           <ScoreCard title="Fluency & Coherence" score={result.fluencyScore} color="text-blue-500" />
           <ScoreCard title="Lexical Resource" score={result.lexicalScore} color="text-green-500" />
           <div className="flex flex-col gap-4 md:col-span-1">
              <ScoreCardSmall title="Grammar" score={result.grammarScore} />
              <ScoreCardSmall title="Pronunciation" score={result.pronunciationScore} />
           </div>
        </div>
     </section>

     {/* 2. SPEECH DNA (Azure-Style Metrics) */}
     {result.speechMetrics && (
       <section>
          <SectionHeader icon="🧬" title="Speech Analysis" />
          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <SpeechMetricCircle label="Prosody" score={result.speechMetrics.prosodyScore} description="Intonation & Rhythm" color="#005F73" />
                <SpeechMetricCircle label="Pronunciation" score={result.speechMetrics.pronunciationScore} description="Phonemic Accuracy" color="#0A9396" />
                <SpeechMetricCircle label="Fluency" score={result.speechMetrics.fluencyScore} description="Speed & Flow" color="#94D2BD" />
                <SpeechMetricCircle label="Completeness" score={result.speechMetrics.completenessScore} description="Syntactic Finish" color="#E9D8A6" />
             </div>
             
             {/* Audio Analysis Feedback - NEW */}
             {result.speechMetrics.feedback && (
               <div className="mt-8 relative bg-soft-gray/30 p-6 rounded-xl border-l-2 border-accent-teal">
                 <div className="flex items-start gap-3">
                    <span className="text-accent-teal mt-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </span>
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest text-accent-teal font-bold mb-2">AI Audio Insight</h4>
                      <p className="text-sm text-gray-600 leading-relaxed font-serif italic">
                        "{result.speechMetrics.feedback}"
                      </p>
                    </div>
                 </div>
               </div>
             )}
          </div>
       </section>
     )}

     {/* 3. HESITATIONS SECTION */}
     <section>
        <SectionHeader icon="🌊" title="Flow & Hesitations" />
        <div className="bg-soft-gray/50 rounded-2xl p-8 border border-white shadow-sm">
          <div className="flex flex-wrap gap-3 mb-8">
            {result.hesitations.map((h, i) => (
              <div 
                key={i} 
                className="relative group px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2 hover:border-red-200 transition-colors cursor-default"
                style={{ transform: `scale(${1 + (Math.min(h.count, 20) / 40)})` }}
              >
                 <span className="text-lg font-serif text-charcoal">{h.word}</span>
                 <span className="flex items-center justify-center h-5 min-w-[1.25rem] px-1 text-[10px] font-bold text-white bg-red-400 rounded-full">
                   {h.count}
                 </span>
              </div>
            ))}
            {result.hesitations.length === 0 && (
               <p className="text-sm text-gray-400 italic">No significant hesitations detected.</p>
            )}
          </div>

          {/* Flow Feedback - NEW */}
          {result.flowFeedback && (
             <div className="border-t border-gray-200 pt-6">
                <div className="flex items-start gap-3">
                   <span className="text-accent-gold mt-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                   </span>
                   <div>
                     <h4 className="text-[10px] uppercase tracking-widest text-accent-gold font-bold mb-2">AI Flow Analysis</h4>
                     <p className="text-sm text-gray-600 leading-relaxed font-serif italic">
                       "{result.flowFeedback}"
                     </p>
                   </div>
                </div>
             </div>
          )}
        </div>
     </section>

     {/* 4. VOCABULARY ISSUES */}
     <section>
        <SectionHeader icon="📖" title={`Vocabulary Issues (${result.vocabularyIssues.length})`} />
        <div className="grid grid-cols-1 gap-6">
           {result.vocabularyIssues.map((issue, i) => (
              <CorrectionCard key={i} item={issue} />
           ))}
        </div>
     </section>

     {/* 5. GRAMMAR ISSUES */}
     <section>
        <SectionHeader icon="⚠️" title={`Grammar Errors (${result.grammarIssues.length})`} />
        <div className="grid grid-cols-1 gap-6">
           {result.grammarIssues.map((issue, i) => (
              <CorrectionCard key={i} item={issue} isGrammar />
           ))}
        </div>
     </section>

     {/* 6. SUGGESTIONS */}
     <div className="grid md:grid-cols-2 gap-8">
        <section>
           <SectionHeader icon="💎" title="Advanced Vocabulary" />
           <div className="flex flex-wrap gap-2">
              {result.advancedVocabulary.map((word, i) => (
                 <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium uppercase tracking-wider rounded-md border border-green-100">
                    {word}
                 </span>
              ))}
           </div>
        </section>

        <section>
           <SectionHeader icon="💡" title="Key Suggestions" />
           <ul className="space-y-4">
              {result.improvements.map((imp, i) => (
                 <li key={i} className="flex gap-4 items-start p-4 bg-white border-l-2 border-accent-gold shadow-sm rounded-r-lg">
                    <span className="text-accent-gold font-bold mt-1">→</span>
                    <span className="text-sm text-gray-600 leading-relaxed">{imp}</span>
                 </li>
              ))}
           </ul>
        </section>
     </div>
  </div>
);

const HistoryCard: React.FC<{ item: AnalysisResult; onClick: () => void; isSample?: boolean }> = ({ item, onClick, isSample }) => (
  <button 
    onClick={onClick}
    className="group flex flex-col items-start bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-gray-200 transition-all duration-300 text-left relative overflow-hidden"
  >
    {isSample && (
       <div className="absolute top-0 right-0 bg-accent-gold text-white text-[9px] uppercase font-bold tracking-widest px-3 py-1 rounded-bl-xl">
          Sample
       </div>
    )}
    
    <div className="mb-4">
       <span className="text-4xl font-bold text-charcoal group-hover:text-accent-teal transition-colors">
         {item.overallScore}
       </span>
       <span className="text-sm text-gray-300 ml-1">/9</span>
    </div>
    
    <div className="space-y-1 mb-6 w-full">
       <div className="flex justify-between text-xs text-gray-500">
          <span>Fluency</span>
          <span className="font-medium">{item.fluencyScore}</span>
       </div>
       <div className="flex justify-between text-xs text-gray-500">
          <span>Pronunciation</span>
          <span className="font-medium">{item.pronunciationScore}</span>
       </div>
       <div className="w-full h-px bg-gray-50 my-1"></div>
       <div className="text-[10px] text-red-400 font-medium">
          {item.hesitations.reduce((acc, curr) => acc + curr.count, 0)} Hesitations
       </div>
    </div>

    <div className="mt-auto pt-4 w-full border-t border-gray-50 flex justify-between items-center">
       <span className="text-[10px] uppercase tracking-widest text-gray-400">
          {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
       </span>
       <span className="text-accent-teal text-lg group-hover:translate-x-1 transition-transform">→</span>
    </div>
  </button>
);

const SectionHeader: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <h3 className="flex items-center gap-3 text-lg font-medium text-charcoal mb-6">
    <span className="opacity-60 grayscale">{icon}</span>
    {title}
  </h3>
);

const SpeechMetricCircle: React.FC<{ label: string; score: number; description: string; color: string }> = ({ label, score, description, color }) => {
   const radius = 30;
   const circumference = 2 * Math.PI * radius;
   const offset = circumference - (score / 100) * circumference;

   return (
      <div className="flex flex-col items-center text-center">
         <div className="relative w-24 h-24 mb-4">
            <svg className="w-full h-full transform -rotate-90">
               <circle cx="48" cy="48" r={radius} stroke="#eee" strokeWidth="4" fill="transparent" />
               <circle 
                  cx="48" cy="48" r={radius} 
                  stroke={color} strokeWidth="4" fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="transition-all duration-1000 ease-out"
               />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-charcoal">
               {score}
            </span>
         </div>
         <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal mb-1">{label}</h4>
         <p className="text-[10px] text-gray-400">{description}</p>
      </div>
   );
};

const ScoreCard: React.FC<{ title: string; score: number; color: string }> = ({ title, score, color }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col justify-center items-center shadow-sm">
     <span className={`text-4xl font-bold mb-2 ${color}`}>{score}<span className="text-lg text-gray-300 font-normal">/9</span></span>
     <span className="text-[10px] uppercase tracking-widest text-gray-400 text-center">{title}</span>
  </div>
);

const ScoreCardSmall: React.FC<{ title: string; score: number }> = ({ title, score }) => (
  <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 flex items-center justify-between shadow-sm">
     <span className="text-[10px] uppercase tracking-widest text-gray-400">{title}</span>
     <span className="text-xl font-bold text-charcoal">{score}</span>
  </div>
);

const CorrectionCard: React.FC<{ item: CorrectionItem, isGrammar?: boolean }> = ({ item, isGrammar }) => (
  <div className="group bg-white rounded-xl border border-gray-100 hover:border-gray-300 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
     <div className="flex flex-col md:flex-row">
        {/* Left: The Error */}
        <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-r border-gray-50 bg-red-50/10">
           <div className="flex justify-between items-start mb-2">
              <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded ${isGrammar ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                 {item.type}
              </span>
           </div>
           <p className="font-serif text-lg text-charcoal/80 mb-1">"{item.original}"</p>
           <p className="text-xs text-red-400 uppercase tracking-wide">Original</p>
        </div>

        {/* Right: The Fix */}
        <div className="p-6 md:w-1/2 bg-white">
           <p className="text-sm text-accent-teal font-medium bg-teal-50 inline-block px-2 py-1 rounded mb-3">
              Suggestion: {item.correction}
           </p>
           <p className="text-sm text-gray-500 font-light leading-relaxed">
              {item.explanation}
           </p>
        </div>
     </div>
  </div>
);

export default AnalysisView;
