
import React, { useState, useEffect } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import PracticeView from './components/PracticeView';
import AnalysisView from './components/AnalysisView';
import ApiKeyModal from './components/ApiKeyModal';
import { AppState, VoiceName, DifficultyMode, AnalysisResult } from './types';
import { generateAnalysisReport, MOCK_SAMPLE_RESULT } from './services/analysisService';
import { getStoredApiKey } from './services/apiKeyService';
import { getStoredHistory, addHistoryItem, deleteHistoryItem } from './services/historyService';

const App: React.FC = () => {
  const { connect, disconnect, appState, transcripts, volumeLevel, getAudioBlob, clearTranscripts } = useGeminiLive();
  const [currentView, setCurrentView] = useState<'practice' | 'analysis'>('practice');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>('beginner');
  const [showIntro, setShowIntro] = useState(true);

  // API Key State
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Analysis State (Lifted from AnalysisView)
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load history and API key on mount
  useEffect(() => {
    // Load History
    const loadedHistory = getStoredHistory();
    setHistory(loadedHistory);

    // Load API Key
    const storedKey = getStoredApiKey();
    if (storedKey) {
      setUserApiKey(storedKey);
    }
  }, []);

  const handleVoiceChange = (voice: VoiceName) => {
    setSelectedVoice(voice);
    if (appState === AppState.ACTIVE) {
      disconnect();
      setTimeout(() => {
        if (userApiKey) {
          connect(userApiKey, voice, true);
        }
      }, 500);
    }
  };

  const handleStart = () => {
    if (!userApiKey) {
      setIsApiKeyModalOpen(true);
    } else {
      setShowIntro(false);
    }
  };

  const handleAnalyze = async () => {
    if (transcripts.length === 0) return;

    setIsAnalyzing(true);
    try {
      if (!userApiKey) {
        setIsApiKeyModalOpen(true);
        throw new Error("API Key missing");
      }

      const audioBlob = getAudioBlob();

      const newResult = await generateAnalysisReport(transcripts, userApiKey, audioBlob);

      if (newResult) {
        const updatedHistory = addHistoryItem(newResult);
        setHistory(updatedHistory);
        setCurrentView('analysis');
      }
    } catch (error) {
      console.error("Analysis failed in App", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteHistory = (id: string) => {
    const updatedHistory = deleteHistoryItem(id);
    setHistory(updatedHistory);
  };

  const handleApiKeySuccess = (key: string) => {
    setUserApiKey(key);
    // If we are on the intro screen, we can optionally auto-enter, but let's just stay there and let user click Enter Session again or just close modal.
    // Actually, if they were trying to start, maybe we should start? 
    // But for simplicity, just save it.
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

        <div className="flex flex-col items-center space-y-6 animate-float-in delay-300">
          <button
            onClick={handleStart}
            className="group relative px-12 py-4 overflow-hidden rounded-none border-b border-charcoal text-charcoal transition-all duration-500 hover:text-accent-teal hover:border-accent-teal"
          >
            <span className="relative text-sm font-medium tracking-widest uppercase">Enter Session</span>
          </button>

          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className="text-xs text-gray-400 hover:text-accent-teal transition-colors tracking-widest uppercase"
          >
            {userApiKey ? 'Update API Key' : 'Set API Key'}
          </button>
        </div>

        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onSuccess={handleApiKeySuccess}
        />
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
            onDelete={handleDeleteHistory}
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
        onStart={() => userApiKey && connect(userApiKey, selectedVoice, true)}
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

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSuccess={handleApiKeySuccess}
      />
    </div>
  );
};

export default App;
