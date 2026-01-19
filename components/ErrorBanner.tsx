import React from 'react';

interface ErrorBannerProps {
  message: string | null;
  onClose?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm animate-fade-in flex items-start gap-3 relative group">
      <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex-1 leading-relaxed">
        {message}
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-red-400 hover:text-red-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};