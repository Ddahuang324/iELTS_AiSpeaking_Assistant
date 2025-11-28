
import React, { useState, useEffect } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import PracticeView from './components/PracticeView';
import AnalysisView from './components/AnalysisView';
import { AppState, VoiceName, DifficultyMode, AnalysisResult } from './types';
import { generateAnalysisReport, MOCK_SAMPLE_RESULT } from './services/analysisService';

const App: React.FC = () => {
  const { connect, disconnect, appState, transcripts, volumeLevel, getAudioBlob, clearTranscripts } = useGeminiLive();
  const [currentView, setCurrentView] = useState<'practice' | 'analysis'>('practice');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>('beginner');
  const [showIntro, setShowIntro] = useState(true);

  // Analysis State (Lifted from AnalysisView)
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('ielts_history');
    let loadedHistory: AnalysisResult[] = [];

    if (saved) {
      try {
        loadedHistory = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // Ensure sample is always present
    if (!loadedHistory.find(h => h.id === MOCK_SAMPLE_RESULT.id)) {
      loadedHistory.push(MOCK_SAMPLE_RESULT);
    }

    // Sort by date desc
    loadedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistory(loadedHistory);
  }, []);

  const handleVoiceChange = (voice: VoiceName) => {
    setSelectedVoice(voice);
    if (appState === AppState.ACTIVE) {
      disconnect();
      setTimeout(() => {
        connect(voice, true);
      }, 500);
    }
  };

  const handleStart = () => {
    setShowIntro(false);
  };

  const handleAnalyze = async () => {
    if (transcripts.length === 0) return;

    setIsAnalyzing(true);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const audioBlob = getAudioBlob();

      const newResult = await generateAnalysisReport(transcripts, apiKey, audioBlob);

      if (newResult) {
        const updatedHistory = [newResult, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('ielts_history', JSON.stringify(updatedHistory));
        setCurrentView('analysis');
      }
    } catch (error) {
      console.error("Analysis failed in App", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (showIntro) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-white text-charcoal font-sans flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_#fbfbfb_0%,_#ffffff_100%)] -z-10"></div>

        <h1 className="text-6xl md:text-8xl font-thin tracking-tighter mb-6 animate-float-in delay-100 selection:bg-accent-teal selection:text-white">
          IELTS <span className="font-normal text-accent-teal">Flow</span>
        </h1>

        <p className="text-xs md:text-sm text-gray-400 uppercase tracking-[0.3em] mb-16 animate-float-in delay-200">
          Immersive Speaking Practice
        </p>

        <button
          onClick={handleStart}
          className="group relative px-12 py-4 overflow-hidden rounded-none border-b border-charcoal text-charcoal transition-all duration-500 hover:text-accent-teal hover:border-accent-teal animate-float-in delay-300"
        >
          <span className="relative text-sm font-medium tracking-widest uppercase">Enter Session</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex bg-white font-sans text-charcoal overflow-hidden">

      {/* 1. Left Sidebar: Navigation & Identity */}
      <LeftSidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* 2. Center: The Stage */}
      <main className="flex-1 relative h-full flex flex-col transition-all duration-500 ease-in-out">
        {currentView === 'practice' ? (
          <PracticeView
            transcripts={transcripts}
            appState={appState}
            volumeLevel={volumeLevel}
            difficultyMode={difficultyMode}
          />
        ) : (
          <AnalysisView
            transcripts={transcripts}
            history={history}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
          />
        )}
      </main>

      {/* 3. Right Sidebar: Controls & Settings */}
      <RightSidebar
        selectedVoice={selectedVoice}
        setSelectedVoice={handleVoiceChange}
        transcripts={transcripts}
        appState={appState}
        difficultyMode={difficultyMode}
        setDifficultyMode={setDifficultyMode}
        onStart={() => connect(selectedVoice, true)}
        onStop={disconnect}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        getAudioBlob={getAudioBlob}
        onClear={clearTranscripts}
      />

      {/* Error Overlay */}
      {appState === AppState.ERROR && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <h2 className="text-3xl font-thin text-red-600 mb-4">Connection Lost</h2>
          <button
            onClick={() => window.location.reload()}
            className="text-sm border-b border-charcoal pb-1 hover:text-red-600 hover:border-red-600 transition-colors"
          >
            Reload Application
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
