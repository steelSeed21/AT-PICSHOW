import React from 'react';
import { PoseCategory, PoseVariant } from '../types';
import { POSE_VARIANTS } from '../constants';

interface PoseSelectorProps {
  selectedCategory: PoseCategory;
  selectedVariant: PoseVariant;
  onPoseChange: (category: PoseCategory, variant: PoseVariant) => void;
  disabled?: boolean;
}

export const PoseSelector: React.FC<PoseSelectorProps> = ({
  selectedCategory,
  selectedVariant,
  onPoseChange,
  disabled = false
}) => {
  const categories = Object.values(PoseCategory);
  const variants = Object.values(PoseVariant);

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div role="group" aria-label="Pose Category Selection">
        <label className="text-sm font-semibold text-slate-300 mb-3 block flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Pose Category
        </label>
        <div className="grid grid-cols-5 gap-2">
          {categories.map(cat => {
            const config = POSE_VARIANTS[cat][PoseVariant.A];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => !disabled && onPoseChange(cat, selectedVariant)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 ring-2 ring-indigo-400/50'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
              >
                <div className="text-lg mb-1" aria-hidden="true">{config.icon}</div>
                <div className="capitalize">{cat}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Variant Selection */}
      <div role="group" aria-label="Pose Style Variant Selection">
        <label className="text-sm font-semibold text-slate-300 mb-3 block flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Style Variant
        </label>
        <div className="grid grid-cols-3 gap-3">
          {variants.map(variant => {
            const config = POSE_VARIANTS[selectedCategory][variant];
            const isSelected = selectedVariant === variant;
            return (
              <button
                key={variant}
                type="button"
                onClick={() => !disabled && onPoseChange(selectedCategory, variant)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={`p-4 rounded-xl text-left transition-all border-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                  isSelected
                    ? 'bg-indigo-900/40 border-indigo-500 shadow-xl shadow-indigo-900/50 ring-2 ring-indigo-400/30'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xl" aria-hidden="true">{config.icon}</div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isSelected
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {variant}
                  </div>
                </div>
                <div className="text-sm font-semibold text-white mb-2">
                  {config.name}
                </div>
                <div className="text-xs text-slate-400 mb-3">
                  {config.description}
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-500 flex items-start gap-1.5">
                    <span className="text-slate-600">🤲</span>
                    <span className="flex-1">{config.handPosition}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-start gap-1.5">
                    <span className="text-slate-600">📐</span>
                    <span className="flex-1">{config.bodyAngle}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-start gap-1.5">
                    <span className="text-slate-600">😊</span>
                    <span className="flex-1">{config.expression}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Selection Summary */}
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="text-3xl" aria-hidden="true">{POSE_VARIANTS[selectedCategory][selectedVariant].icon}</div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              Selected Pose Configuration
            </div>
            <div className="text-sm font-bold text-white mb-1">
              {POSE_VARIANTS[selectedCategory][selectedVariant].name}
            </div>
            <div className="text-xs text-slate-400">
              {POSE_VARIANTS[selectedCategory][selectedVariant].description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};