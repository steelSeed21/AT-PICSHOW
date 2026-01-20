import React from 'react';
import { PromptInput } from './PromptInput';

interface CustomEditPanelProps {
  editPrompt: string;
  setEditPrompt: (val: string) => void;
  isLoading: boolean;
  onApply: () => void;
  tips: string[];
}

export const CustomEditPanel: React.FC<CustomEditPanelProps> = ({
  editPrompt,
  setEditPrompt,
  isLoading,
  onApply,
  tips
}) => {
  const addSuggestion = (suggestion: string) => {
    const trimmed = editPrompt.trim();
    if (!trimmed) {
      setEditPrompt(suggestion);
    } else if (trimmed.endsWith(',')) {
      setEditPrompt(`${trimmed} ${suggestion}`);
    } else {
      setEditPrompt(`${trimmed}, ${suggestion}`);
    }
  };

  return (
    <div className="border border-slate-700 bg-slate-800/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Precision Retouching</h3>
        <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full border border-slate-600">Strict Constraints Active</span>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
           <span className="text-indigo-400 text-xs">✨</span>
           <p className="text-xs text-indigo-200 font-medium">AI Detected Fixes (Analysis Results):</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tips.map((chip, idx) => {
            const isSelected = editPrompt.includes(chip);
            return (
              <button
                  key={idx}
                  onClick={() => addSuggestion(chip)}
                  className={`text-xs px-3 py-1 rounded-full transition-all animate-fade-in border ${
                      isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-500' 
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-500 hover:text-white'
                  }`}
                  disabled={isLoading}
              >
                  {isSelected ? '✓ ' : '+ '}{chip}
              </button>
            );
          })}
        </div>
      </div>

      <PromptInput 
        value={editPrompt}
        onChange={setEditPrompt}
        onSubmit={onApply}
        isLoading={isLoading}
        placeholder="Select an AI fix above or describe specific adjustments..."
        buttonLabel="Generate Custom Edit"
        variant="default"
      />
    </div>
  );
};