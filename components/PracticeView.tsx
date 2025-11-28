import React from 'react';
import Transcript from './Transcript';
import { TranscriptItem, AppState, DifficultyMode } from '../types';

interface PracticeViewProps {
  transcripts: TranscriptItem[];
  appState: AppState;
  volumeLevel: number;
  difficultyMode: DifficultyMode;
}

const PracticeView: React.FC<PracticeViewProps> = ({ transcripts, appState, volumeLevel, difficultyMode }) => {
  
  // Ambient background opacity based on volume/activity
  const ambientOpacity = appState === AppState.ACTIVE ? 0.3 + (volumeLevel * 0.5) : 0;

  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      
      {/* 1. Ambient Living Background (Replaces visualizer) */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-out"
        style={{ opacity: appState === AppState.ACTIVE ? 1 : 0 }}
      >
        {/* Teal Pulse (Examiner/System) */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent-teal/5 rounded-full blur-[100px] animate-pulse-slow"></div>
        
        {/* Gold Pulse (User Reactivity) */}
        <div 
           className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent-gold/5 rounded-full blur-[120px] transition-transform duration-100"
           style={{ 
             transform: `scale(${1 + volumeLevel * 2})`,
             opacity: ambientOpacity 
           }}
        ></div>
      </div>

      {/* 2. Empty State (Minimalist) */}
      {transcripts.length === 0 && (
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <span className="text-[10px] uppercase tracking-[0.4em] text-gray-300 animate-pulse">
               {appState === AppState.ACTIVE ? 'Listening...' : 'Ready to Start'}
            </span>
         </div>
      )}

      {/* 3. Transcript (The Core Content) */}
      <Transcript items={transcripts} difficultyMode={difficultyMode} />
      
    </div>
  );
};

export default PracticeView;