import React, { useState, useEffect } from 'react';
import { EnhancementPreset, EnhancementCategory, VisualAnalysisResult } from '../types';
import { ENHANCEMENT_PRESETS } from '../constants';

interface OfferBoosterPanelProps {
  selectedFile: File | null;
  analysisResult: VisualAnalysisResult | null;
  selectedEnhancement: string | null;
  onEnhance: (id: string) => void;
  isLoading: boolean;
  recommendedPresets: Set<string>;
}

// Mapping internal categories to UI Tabs
const TABS = [
  { id: 'UNIVERSAL', label: 'Essentials', icon: '🛠️' },
  { id: 'COMMERCIAL', label: 'Travel Standards', icon: '🌍' },
  { id: 'ATMOSPHERE', label: 'Creative Moods', icon: '🎨' }
];

export const OfferBoosterPanel: React.FC<OfferBoosterPanelProps> = ({
  selectedFile,
  analysisResult,
  selectedEnhancement,
  onEnhance,
  isLoading,
  recommendedPresets
}) => {
  const [activeTab, setActiveTab] = useState<string>('UNIVERSAL');

  // Auto-switch tab if the *only* recommended preset is in a specific category (and no enhancement selected yet)
  useEffect(() => {
    if (!selectedEnhancement && recommendedPresets.size > 0) {
        // Find which category has the most recommendations
        let bestCategory = 'UNIVERSAL';
        let maxCount = 0;

        TABS.forEach(tab => {
            const count = ENHANCEMENT_PRESETS.filter(p => p.category === tab.id && recommendedPresets.has(p.id)).length;
            if (count > maxCount) {
                maxCount = count;
                bestCategory = tab.id;
            }
        });

        // Only switch if we found a strong match in Commercial or Atmosphere (Universal is default)
        if (bestCategory !== 'UNIVERSAL') {
            setActiveTab(bestCategory);
        }
    }
  }, [recommendedPresets, selectedEnhancement]);

  // Filter presets for current tab
  const currentPresets = ENHANCEMENT_PRESETS.filter(p => p.category === activeTab);

  const renderPresetButton = (preset: EnhancementPreset) => {
    const isSelected = selectedEnhancement === preset.id;
    const isRecommended = recommendedPresets.has(preset.id);
    const isUniversal = preset.category === 'UNIVERSAL';
    
    // Disable interaction if loading or no file, but keep visible. 
    // If no file, we reduce opacity slightly to indicate dependency but keep it readable.
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
            : isUniversal
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-indigo-400/50 hover:bg-slate-800'
              : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/80 hover:border-slate-500'
          }
        `}
      >
        {isRecommended && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse"></span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">Recommended</span>
            </div>
        )}

        <div className={`text-3xl mb-3 transition-transform duration-300 ${!isDisabled && 'group-hover:scale-110'}`}>
          {preset.icon}
        </div>
        
        <div className="w-full">
            <div className={`text-sm font-bold leading-tight mb-1.5 ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                {preset.label}
            </div>
            <div className={`text-[11px] leading-relaxed ${isSelected ? 'text-indigo-100' : 'text-slate-400 group-hover:text-slate-300'}`}>
                {preset.description}
            </div>
        </div>

        {/* Selected checkmark */}
        {isSelected && (
            <div className="absolute bottom-3 right-3 text-white opacity-20 transform scale-150">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header Area */}
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                   Offer Booster
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-medium text-indigo-300">
                     {selectedFile ? 'Select One Target Style' : 'Upload image to enable styles'}
                </p>
            </div>
            {analysisResult ? (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    AI ACTIVE
                </div>
            ) : (
                !selectedFile && (
                    <div className="text-[10px] text-slate-500 font-mono px-2 py-1 rounded border border-slate-700 bg-slate-800">
                        WAITING FOR SOURCE
                    </div>
                )
            )}
        </div>

        {/* TABS NAVIGATION */}
        <div className={`bg-slate-900/50 p-1 rounded-xl border border-slate-700 grid grid-cols-3 gap-1 relative ${!selectedFile ? 'opacity-80' : ''}`}>
            {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                // Check if this tab has any recommended items
                const hasRecommendation = ENHANCEMENT_PRESETS.some(p => p.category === tab.id && recommendedPresets.has(p.id));
                
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        disabled={isLoading}
                        className={`
                            relative py-2.5 px-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1
                            ${isActive 
                                ? 'bg-slate-700 text-white shadow-sm' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }
                        `}
                    >
                        {/* Notification Dot for Recommendation in other tabs */}
                        {hasRecommendation && !isActive && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900"></span>
                        )}
                        
                        <span className="text-base grayscale opacity-80">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>

        {/* PRESET GRID */}
        <div className="min-h-[200px]">
            <div className="grid grid-cols-1 gap-3 animate-fade-in">
                {currentPresets.map(preset => renderPresetButton(preset))}
            </div>
            
            {/* Contextual Helpers */}
            {activeTab === 'UNIVERSAL' && (
                 <div className="mt-3 text-[10px] text-slate-500 text-center italic">
                    Best for general purpose cleanup. Preserves original look while fixing lighting & noise.
                 </div>
            )}
             {activeTab === 'COMMERCIAL' && (
                 <div className="mt-3 text-[10px] text-slate-500 text-center italic">
                    Optimized for conversion. Follows industry standards for Hotels, Dining, and Markets.
                 </div>
            )}
        </div>
    </div>
  );
};