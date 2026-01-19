import React from 'react';
import { Button } from './Button';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder: string;
  buttonLabel: string;
  onCancel?: () => void;
  className?: string;
  variant?: 'default' | 'overlay';
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder,
  buttonLabel,
  onCancel,
  className = '',
  variant = 'default'
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (value.trim()) onSubmit();
    }
  };

  const bgClass = variant === 'overlay' ? 'bg-slate-900' : 'bg-slate-900';
  const borderClass = variant === 'overlay' ? 'border-slate-700' : 'border-slate-700';

  return (
    <div className={`space-y-3 ${className}`}>
      <textarea 
        className={`w-full ${bgClass} border ${borderClass} rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-600 font-mono resize-none transition-colors`}
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      />
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-500 hidden sm:inline-block">
          Press <kbd className="font-sans bg-slate-800 px-1 rounded border border-slate-700">Ctrl</kbd> + <kbd className="font-sans bg-slate-800 px-1 rounded border border-slate-700">Enter</kbd> to submit
        </span>
        <div className="flex gap-2 ml-auto">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} size="sm" disabled={isLoading} type="button">
              Cancel
            </Button>
          )}
          <Button 
            onClick={onSubmit} 
            disabled={!value.trim()} 
            isLoading={isLoading}
            variant={variant === 'overlay' ? 'primary' : 'secondary'}
            size="sm"
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};