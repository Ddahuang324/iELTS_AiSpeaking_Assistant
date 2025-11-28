import React from 'react';

interface LeftSidebarProps {
  currentView: 'practice' | 'analysis';
  setCurrentView: (view: 'practice' | 'analysis') => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <div className="w-20 md:w-24 h-full flex flex-col items-center py-12 border-r border-gray-100 bg-white z-20">
      {/* Brand Icon */}
      <div className="mb-16 w-8 h-8 rounded-full border border-charcoal flex items-center justify-center">
         <div className="w-2 h-2 bg-accent-teal rounded-full"></div>
      </div>

      {/* Vertical Navigation */}
      <nav className="flex-1 flex flex-col gap-12">
        <NavButton 
          active={currentView === 'practice'} 
          onClick={() => setCurrentView('practice')}
          label="Practice"
        />
        <NavButton 
          active={currentView === 'analysis'} 
          onClick={() => setCurrentView('analysis')}
          label="Analysis"
        />
      </nav>
      
      <div className="text-[10px] text-gray-300 transform -rotate-90 whitespace-nowrap mb-8 tracking-widest">
         V 1.0.0
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className="group relative h-32 w-full flex items-center justify-center"
  >
    <span 
      className={`absolute transform -rotate-90 text-xs uppercase tracking-[0.2em] transition-all duration-500 ease-out ${
        active ? 'text-charcoal font-semibold' : 'text-gray-300 group-hover:text-gray-500'
      }`}
    >
      {label}
    </span>
    {active && (
      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-12 bg-accent-teal animate-fade-in"></span>
    )}
  </button>
);

export default LeftSidebar;