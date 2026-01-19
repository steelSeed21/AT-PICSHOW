import React from 'react';
import { AttireType, LogoTechnique } from '../types';
import { ATTIRE_LOGO_MAPPING } from '../constants';

interface AttireSelectorProps {
  selected: AttireType;
  onAttireChange: (attire: AttireType) => void;
  disabled?: boolean;
}

const ATTIRE_ICONS: Record<AttireType, string> = {
  [AttireType.SUIT]: '🤵',
  [AttireType.SHIRT]: '👔',
  [AttireType.POLO]: '👕',
  [AttireType.TSHIRT]: '👚',
  [AttireType.JACKET]: '🧥'
};

const ATTIRE_DESCRIPTIONS: Record<AttireType, string> = {
  [AttireType.SUIT]: 'Formal business attire',
  [AttireType.SHIRT]: 'Professional dress shirt',
  [AttireType.POLO]: 'Business casual polo',
  [AttireType.TSHIRT]: 'Casual t-shirt',
  [AttireType.JACKET]: 'Casual or technical jacket'
};

// Helper functions (moved local to component as they are UI helpers)
function getAttireDisplayName(attire: AttireType): string {
  const names: Record<AttireType, string> = {
    [AttireType.SUIT]: 'Business Suit',
    [AttireType.SHIRT]: 'Dress Shirt',
    [AttireType.POLO]: 'Polo Shirt',
    [AttireType.TSHIRT]: 'T-Shirt',
    [AttireType.JACKET]: 'Jacket'
  };
  return names[attire];
}

function getLogoTechniqueDisplayName(technique: LogoTechnique): string {
  const names: Record<LogoTechnique, string> = {
    [LogoTechnique.EMBROIDERED_PIN]: 'Metal Pin',
    [LogoTechnique.CHEST_EMBROIDERY]: 'Embroidered',
    [LogoTechnique.SCREEN_PRINT]: 'Screen Print',
    [LogoTechnique.WOVEN_PATCH]: 'Woven Patch',
    [LogoTechnique.ENGRAVED_BADGE]: 'Engraved Badge'
  };
  return names[technique];
}

export const AttireSelector: React.FC<AttireSelectorProps> = ({
  selected,
  onAttireChange,
  disabled = false
}) => {
  const selectedLogoInfo = ATTIRE_LOGO_MAPPING[selected];

  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-slate-300 block flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        Attire Type
      </label>
      
      {/* Attire Type Selection Grid */}
      <div className="grid grid-cols-5 gap-2">
        {Object.values(AttireType).map(attire => {
          const logoInfo = ATTIRE_LOGO_MAPPING[attire];
          const isSelected = selected === attire;
          
          return (
            <button
              key={attire}
              onClick={() => !disabled && onAttireChange(attire)}
              disabled={disabled}
              className={`p-4 rounded-xl text-center transition-all border-2 relative group ${
                isSelected
                  ? 'bg-indigo-900/40 border-indigo-500 shadow-xl shadow-indigo-900/50 ring-2 ring-indigo-400/30'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Icon */}
              <div className="text-3xl mb-2">{ATTIRE_ICONS[attire]}</div>
              
              {/* Name */}
              <div className="text-xs text-white font-semibold mb-1 capitalize">
                {getAttireDisplayName(attire)}
              </div>
              
              {/* Logo Technique Badge */}
              <div className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                isSelected 
                  ? 'bg-indigo-500/30 text-indigo-300' 
                  : 'bg-slate-700/50 text-slate-500'
              }`}>
                {getLogoTechniqueDisplayName(logoInfo.technique)}
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                {ATTIRE_DESCRIPTIONS[attire]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Logo Application Info */}
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-xl p-4 space-y-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/50">
          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Logo Application Method
            </div>
            <div className="text-sm font-bold text-white">
              {getLogoTechniqueDisplayName(selectedLogoInfo.technique)}
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {/* Position */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 flex items-center justify-center text-slate-500">📍</div>
            <div className="flex-1">
              <div className="text-slate-400 font-medium mb-0.5">Placement</div>
              <div className="text-slate-300">{selectedLogoInfo.position}</div>
            </div>
          </div>

          {/* Size */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 flex items-center justify-center text-slate-500">📏</div>
            <div className="flex-1">
              <div className="text-slate-400 font-medium mb-0.5">Size</div>
              <div className="text-slate-300">{selectedLogoInfo.size}</div>
            </div>
          </div>

          {/* Material */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 flex items-center justify-center text-slate-500">🧵</div>
            <div className="flex-1">
              <div className="text-slate-400 font-medium mb-0.5">Material</div>
              <div className="text-slate-300">{selectedLogoInfo.material}</div>
            </div>
          </div>
        </div>

        {/* Visual Quality Info */}
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>AI will render photorealistic {getLogoTechniqueDisplayName(selectedLogoInfo.technique).toLowerCase()} with proper material physics</span>
          </div>
        </div>
      </div>

      {/* Technical Details Accordion */}
      <details className="group">
        <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-2 select-none">
          <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          View Technical Rendering Details
        </summary>
        <div className="mt-3 p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-[10px] text-slate-500 space-y-2">
          <div>
            <span className="text-slate-400 font-semibold">Lighting Behavior:</span>
            <div className="mt-1">{selectedLogoInfo.lightingBehavior}</div>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <span className="text-slate-400 font-semibold">Physicality Rules:</span>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[9px] leading-relaxed">
              {selectedLogoInfo.physicalityRules.trim()}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
};