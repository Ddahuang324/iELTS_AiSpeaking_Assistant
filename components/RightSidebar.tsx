
import React from 'react';
import { VoiceName, AppState, TranscriptItem, DifficultyMode } from '../types';

interface RightSidebarProps {
  selectedVoice: VoiceName;
  setSelectedVoice: (voice: VoiceName) => void;
  transcripts: TranscriptItem[];
  appState: AppState;
  difficultyMode: DifficultyMode;
  setDifficultyMode: (mode: DifficultyMode) => void;
  onStart: () => void;
  onStop: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  getAudioBlob?: () => Blob | null;
  onClear?: () => void;
}

const VOICES: VoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'];

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedVoice,
  setSelectedVoice,
  transcripts,
  appState,
  difficultyMode,
  setDifficultyMode,
  onStart,
  onStop,
  onAnalyze,
  isAnalyzing,
  getAudioBlob,
  onClear
}) => {

  const handleExport = () => {
    const mdContent = transcripts.map(t =>
      `**${t.role === 'user' ? 'Candidate' : 'Examiner'}**: ${t.text}\n\n`
    ).join('');

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ielts-session.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAudio = () => {
    if (!getAudioBlob) return;
    const blob = getAudioBlob();
    if (!blob) {
      alert("No audio recorded.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ielts-session-audio.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-64 h-full bg-soft-gray/50 border-l border-gray-100 flex flex-col py-12 px-6 z-20 backdrop-blur-sm">

      {/* Status Indicator */}
      <div className="mb-12 flex flex-col items-start">
        <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Status</span>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${appState === AppState.ACTIVE ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className={`text-xs font-medium tracking-wider ${appState === AppState.ACTIVE ? 'text-charcoal' : 'text-gray-400'}`}>
            {appState === AppState.ACTIVE ? 'LIVE SESSION' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="mb-12">
        {appState === AppState.ACTIVE ? (
          <button
            onClick={onStop}
            className="w-full py-3 border border-red-200 text-red-500 hover:bg-red-50 text-xs uppercase tracking-widest transition-colors"
          >
            End Session
          </button>
        ) : (
          <button
            onClick={onStart}
            className="w-full py-3 bg-charcoal text-white hover:bg-accent-teal text-xs uppercase tracking-widest transition-colors shadow-lg shadow-gray-200"
          >
            Start Speaking
          </button>
        )}
      </div>

      {/* Mode Selection */}
      <div className="mb-10">
        <h3 className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">Practice Mode</h3>
        <div className="flex bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setDifficultyMode('beginner')}
            className={`flex-1 py-2 rounded-md text-[10px] uppercase tracking-wider transition-all duration-300 ${difficultyMode === 'beginner'
              ? 'bg-white text-charcoal shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Beginner
          </button>
          <button
            onClick={() => setDifficultyMode('advanced')}
            className={`flex-1 py-2 rounded-md text-[10px] uppercase tracking-wider transition-all duration-300 ${difficultyMode === 'advanced'
              ? 'bg-white text-charcoal shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Advanced
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 font-light leading-relaxed">
          {difficultyMode === 'beginner' ? 'Audio & Text enabled for examiner responses.' : 'Audio only. Examiner text is hidden to simulate real exam conditions.'}
        </p>
      </div>

      {/* Voice Selection */}
      <div className="mb-auto">
        <h3 className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">Examiner Voice</h3>
        <div className="relative">
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
            disabled={false}
            className="w-full bg-white border border-gray-200 text-charcoal text-xs uppercase tracking-wider py-3 px-4 rounded-none appearance-none focus:outline-none focus:border-accent-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {VOICES.map((voice) => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </select>
          {/* Custom Arrow Icon */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" className="text-gray-400">
              <path d="M1 1L5 5L9 1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="pt-8 border-t border-gray-200 space-y-4">
        {/* Generate Report Button */}
        <button
          onClick={onAnalyze}
          disabled={transcripts.length === 0 || isAnalyzing}
          className="w-full flex items-center justify-center gap-2 py-3 bg-accent-teal/5 border border-accent-teal/20 text-accent-teal hover:bg-accent-teal hover:text-white text-xs uppercase tracking-widest transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-accent-teal"
        >
          {isAnalyzing ? (
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          )}
          {isAnalyzing ? 'Analyzing...' : 'Generate Report'}
        </button>

        {/* Clear Chat Button */}
        <button
          onClick={onClear}
          disabled={transcripts.length === 0 || (appState !== AppState.IDLE && appState !== AppState.ENDED)}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-red-500 uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Clear Chat
        </button>

        {/* Export Audio */}
        <button
          onClick={handleExportAudio}
          disabled={transcripts.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-charcoal uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          Export Audio
        </button>

        {/* Export MD */}
        <button
          onClick={handleExport}
          disabled={transcripts.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-charcoal uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export to MD
        </button>
      </div>

    </div>
  );
};

export default RightSidebar;
