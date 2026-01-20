import React from 'react';
import { EnhancementPreset, EnhancementCategory, VisualAnalysisResult } from '../types';
import { ENHANCEMENT_PRESETS } from '../constants';
import { CustomEditPanel } from './CustomEditPanel';
import { Card } from './Card';

interface OfferBoosterPanelProps {
  selectedFile: File | null;
  analysisResult: VisualAnalysisResult | null;
  selectedEnhancement: string | null;
  onEnhance: (id: string) => void;
  isLoading: boolean;
  recommendedPresets: Set<string>;
  editPrompt: string;
  setEditPrompt: (val: string) => void;
  onCustomEdit: () => void;
  tips: string[];
}

export const OfferBoosterPanel: React.FC<OfferBoosterPanelProps> = ({
  selectedFile,
  analysisResult,
  selectedEnhancement,
  onEnhance,
  isLoading,
  recommendedPresets,
  editPrompt,
  setEditPrompt,
  onCustomEdit,
  tips
}) => {
  if (!selectedFile) return null;

  // Helper to render a single preset card
  const renderPresetCard = (preset: EnhancementPreset, isRecommended: boolean) => (
    <button
        key={preset.id}
        onClick={() => onEnhance(preset.id)}
        disabled={isLoading}
        className={`relative flex flex-col p-4 border rounded-xl transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed h-full ${
            selectedEnhancement === preset.id
            ? 'bg-indigo-900/40 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400'
            : isRecommended 
              ? 'bg-gradient-to-br from-indigo-900/10 to-slate-800/80 border-indigo-500/30 hover:bg-indigo-900/20 hover:border-indigo-500/50'
              : 'bg-slate-800/50 border-slate-700 hover:bg-indigo-900/20 hover:border-indigo-500/30'
        }`}
    >
        {isRecommended && (
            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10 animate-fade-in border border-emerald-400/50 tracking-wide">
                BEST MATCH
            </span>
        )}

        <div className="flex items-center gap-3 mb-2">
             <div className="text-2xl filter drop-shadow-md">{preset.icon}</div>
             <div className={`text-sm font-bold ${selectedEnhancement === preset.id ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                {preset.label}
             </div>
        </div>
        
        <div className="text-[11px] text-slate-400 leading-snug group-hover:text-slate-300 transition-colors">
            {preset.description}
        </div>
    </button>
  );

  const renderSection = (category: EnhancementCategory, title: string) => {
    const presets = ENHANCEMENT_PRESETS.filter(p => p.category === category);
    if (presets.length === 0) return null;

    // Filter logic: If we have specific recommendations in this category, prioritize them
    // Or just render normally. 
    // UX Decision: For categories with recommendations, we could highlight them or sort them.
    // Current approach: Just sort recommendations to the top within the category?
    // Let's keep the grid structure stable but rely on the "Best Match" badge.
    
    return (
        <div className="mb-6 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
                <div className="h-px bg-slate-800 flex-1"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presets.map(preset => renderPresetCard(preset, recommendedPresets.has(preset.id)))}
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
        
        {/* Marketing Context Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl border border-indigo-500/20 shadow-lg">
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-indigo-400">🚀</span> Offer Booster
                </h2>
                {analysisResult && (
                     <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        AI ANALYSIS ACTIVE
                     </div>
                )}
            </div>
            <p className="text-xs text-slate-400">
                Enhance visual appeal for marketing & sales channels.
            </p>
        </div>

        {/* 1. UNIVERSAL CORRECTION (The "Foundation") */}
        <Card className="border-slate-700 bg-slate-800/30">
            {renderSection('UNIVERSAL', 'Foundation (Recommended for All)')}
        </Card>

        {/* 2. SPECIFIC STYLES */}
        <Card className="border-indigo-500/20 bg-indigo-900/5">
             {renderSection('COMMERCIAL', 'Industry Standards')}
             {renderSection('ATMOSPHERE', 'Atmosphere & Mood')}
        </Card>

        {/* 3. MANUAL OVERRIDE */}
        <CustomEditPanel 
            editPrompt={editPrompt}
            setEditPrompt={setEditPrompt}
            isLoading={isLoading}
            onApply={onCustomEdit}
            tips={tips}
        />
    </div>
  );
};