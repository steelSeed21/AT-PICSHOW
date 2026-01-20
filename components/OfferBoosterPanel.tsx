import React from 'react';
import { EnhancementPreset, VisualAnalysisResult } from '../types';
import { ENHANCEMENT_PRESETS } from '../constants';
import { Button } from './Button';

interface OfferBoosterPanelProps {
  selectedFile: File | null;
  analysisResult: VisualAnalysisResult | null;
  selectedEnhancement: string | null;
  onEnhance: (id: string) => void;
  isLoading: boolean;
  recommendedPresets: Set<string>;
  onReset: () => void;
  hasHistory: boolean;
}

export const OfferBoosterPanel: React.FC<OfferBoosterPanelProps> = ({
  selectedFile,
  analysisResult,
  selectedEnhancement,
  onEnhance,
  isLoading,
  recommendedPresets,
  onReset,
  hasHistory
}) => {
  
  const standardPresets = ENHANCEMENT_PRESETS.filter(p => p.category === 'UNIVERSAL' || p.category === 'COMMERCIAL');
  const creativePresets = ENHANCEMENT_PRESETS.filter(p => p.category === 'ATMOSPHERE');

  const renderPresetButton = (preset: EnhancementPreset) => {
    const isSelected = selectedEnhancement === preset.id;
    const isRecommended = recommendedPresets.has(preset.id);
    
    const isDisabled = isLoading || !selectedFile;
    const opacityClass = !selectedFile ? 'opacity-80' : (isLoading ? 'opacity-50' : 'opacity-100');

    return (
      <button
        key={preset.id}
        onClick={() => onEnhance(preset.id)}
        disabled={isDisabled}
        className={`
          relative flex flex-col p-4 border rounded-xl transition-all text-left group disabled:cursor-not-allowed ${opacityClass}
          ${isSelected 
            ? 'bg-indigo-600 text-white shadow-xl ring-2 ring-indigo-400 border-transparent transform scale-[1.02]' 
            : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/80 hover:border-slate-500'
          }
        `}
      >
        {isRecommended && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse"></span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">AI Pick</span>
            </div>
        )}

        <div className={`text-2xl mb-2 transition-transform duration-300 ${!isDisabled && 'group-hover:scale-110'}`}>
          {preset.icon}
        </div>
        
        <div className="w-full">
            <div className={`text-sm font-bold leading-tight mb-1 ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                {preset.label}
            </div>
            <div className={`text-[11px] leading-tight ${isSelected ? 'text-indigo-100' : 'text-slate-400 group-hover:text-slate-300'}`}>
                {preset.description}
            </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header & Reset Area */}
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                   Offer Booster
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                     Iterative styling engine
                </p>
            </div>
            
            {hasHistory && (
                 <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onReset}
                    disabled={isLoading}
                    className="text-xs border-red-500/30 text-red-300 hover:bg-red-900/20 hover:border-red-500/50 hover:text-red-200"
                 >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset to Original
                 </Button>
            )}
        </div>

        {/* Section 1: Industry Standards */}
        <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
                Industry Standards (Quality)
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {standardPresets.map(preset => renderPresetButton(preset))}
            </div>
        </div>

        {/* Section 2: Creative Atmosphere */}
        <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
                Creative Atmosphere (Mood)
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {creativePresets.map(preset => renderPresetButton(preset))}
            </div>
        </div>

        {/* Status Indicator */}
        {analysisResult && (
            <div className="flex items-center gap-2 justify-center pt-2 opacity-50">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] text-slate-400 font-mono">ANALYSIS ACTIVE • PRESETS OPTIMIZED</span>
            </div>
        )}
    </div>
  );
};