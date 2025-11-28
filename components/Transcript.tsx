import React, { useEffect, useRef } from 'react';
import { TranscriptItem, DifficultyMode } from '../types';

interface TranscriptProps {
  items: TranscriptItem[];
  difficultyMode: DifficultyMode;
}

const Transcript: React.FC<TranscriptProps> = ({ items, difficultyMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [items, difficultyMode]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-y-auto px-8 py-12 sm:px-16 scroll-smooth"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-12 pb-24">
        {items.map((item) => {
          const isModel = item.role === 'model';
          // Check if this is the examiner and we are in advanced mode
          const isHidden = isModel && difficultyMode === 'advanced';

          return (
            <div 
              key={item.id}
              className={`flex flex-col animate-float-in opacity-0 ${
                !isModel ? 'items-end text-right' : 'items-start text-left'
              }`}
              style={{ animationFillMode: 'forwards' }}
            >
              {/* Role Label */}
              <span className={`text-[10px] uppercase tracking-widest mb-2 ${
                !isModel ? 'text-accent-gold' : 'text-accent-teal'
              }`}>
                {!isModel ? 'You' : 'Examiner'}
              </span>

              {/* Text Content */}
              {isHidden ? (
                // Advanced Mode Placeholder
                <div className="flex items-center gap-3 py-2 px-4 bg-soft-gray/50 rounded-lg border border-transparent hover:border-gray-200 transition-colors cursor-help group">
                  <div className="flex gap-1 items-end h-4">
                    <div className="w-1 bg-accent-teal/40 h-2 animate-[pulse_1s_ease-in-out_infinite]"></div>
                    <div className="w-1 bg-accent-teal/40 h-4 animate-[pulse_1.2s_ease-in-out_infinite_0.1s]"></div>
                    <div className="w-1 bg-accent-teal/40 h-2 animate-[pulse_1s_ease-in-out_infinite_0.2s]"></div>
                  </div>
                  <span className="text-sm font-light text-gray-400 tracking-wide">Audio Response</span>
                  
                  {/* Tooltip to peek (optional UX helper) */}
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity top-full mt-2 left-0 z-50 p-3 bg-white shadow-xl rounded-lg border border-gray-100 max-w-sm pointer-events-none">
                    <p className="text-xs text-gray-500 italic font-serif">
                       {item.text || "Listening..."}
                    </p>
                  </div>
                </div>
              ) : (
                // Standard Text Mode
                <p className={`
                  max-w-[80%] text-xl sm:text-2xl md:text-3xl font-light leading-relaxed
                  ${!isModel ? 'text-charcoal font-sans' : 'text-gray-500 font-serif italic'}
                `}>
                  {item.text}
                  {item.isPartial && (
                    <span className="inline-block w-2 h-2 ml-2 rounded-full bg-gray-300 animate-pulse align-middle"></span>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Transcript;