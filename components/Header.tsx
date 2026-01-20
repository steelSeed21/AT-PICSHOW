import React from 'react';
import { AppMode } from '../types';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  disabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ mode, onModeChange, disabled }) => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Inline SVG Logo to guarantee visibility without external dependencies */}
          <svg width="170" height="26" viewBox="0 0 170 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Automate.travel">
            {/* Icon Mark */}
            <path d="M12.5 5C9.5 5 7.5 7 7 9C6.5 7 4.5 5 1.5 5C0.5 5 0 5.5 0 6V18C0 19.5 1.5 21 3.5 21C6.5 21 8.5 19 9 17C9.5 19 11.5 21 14.5 21C16.5 21 18 19.5 18 18V6C18 5.5 17.5 5 16.5 5C15.5 5 13.5 5 12.5 5ZM3.5 19C2.5 19 2 18.5 2 18V7C2.5 6.5 4 6.5 5 7.5C6 8.5 6 10.5 6 10.5V17C6 17 5.5 18.5 3.5 19ZM14.5 19C13.5 19 12 18.5 12 17V10.5C12 10.5 12 8.5 13 7.5C14 6.5 15.5 6.5 16 7V18C16 18.5 15.5 19 14.5 19Z" fill="white"/>
            {/* Text Logo */}
            <text x="26" y="19" fill="white" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="700">Automate.</text>
            <text x="118" y="19" fill="#818CF8" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="400">travel</text>
          </svg>
          
          <div className="text-lg md:text-xl font-bold border-l border-slate-700 pl-4 ml-1">
            <span className="font-light text-slate-500 hidden sm:inline">AI Visual Suite v2</span>
          </div>
        </div>
        <nav className={`flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <button
            onClick={() => onModeChange(AppMode.OFFER_BOOSTER)}
            disabled={disabled}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              mode === AppMode.OFFER_BOOSTER 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Offer Booster
          </button>
          <button
            onClick={() => onModeChange(AppMode.IDENTITY_BUILDER)}
            disabled={disabled}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              mode === AppMode.IDENTITY_BUILDER 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Identity Builder
          </button>
        </nav>
      </div>
    </header>
  );
};