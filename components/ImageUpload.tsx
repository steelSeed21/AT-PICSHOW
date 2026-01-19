import React, { useRef } from 'react';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  hasFile?: boolean;
  variant?: 'default' | 'compact';
  label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onFileSelect, 
  isLoading, 
  hasFile, 
  variant = 'default',
  label
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleContainerClick = () => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isLoading && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={label || "Upload image"}
      aria-disabled={isLoading}
      className={`border-2 border-dashed rounded-xl text-center transition-all group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
        isLoading 
          ? 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-800/20' 
          : hasFile
            ? 'border-indigo-500/50 bg-indigo-900/10 hover:bg-indigo-900/20 cursor-pointer'
            : 'border-slate-600 bg-slate-800/20 hover:bg-slate-800/40 cursor-pointer'
      } ${isCompact ? 'p-4' : 'p-8'}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif, .png, .jpg, .jpeg, .webp, .heic, .heif"
        className="hidden"
        disabled={isLoading}
      />
      
      <div className={`flex flex-col items-center justify-center ${isCompact ? 'gap-2' : 'gap-4'}`}>
        <div className={`rounded-full transition-colors flex items-center justify-center ${
            hasFile ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700/50 text-indigo-400'
        } ${isCompact ? 'p-2 w-8 h-8' : 'p-4 w-16 h-16'}`}>
          {hasFile ? (
             <svg className={`${isCompact ? 'w-4 h-4' : 'w-8 h-8'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
          ) : (
            <svg className={`${isCompact ? 'w-4 h-4' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          <p className={`font-medium ${hasFile ? 'text-indigo-200' : 'text-slate-200'} ${isCompact ? 'text-xs' : 'text-lg'}`}>
            {label || (hasFile ? "Replace Image" : (isCompact ? "Upload File" : "Drop image here or click to upload"))}
          </p>
          {!isCompact && (
            <p className="text-sm text-slate-400 mt-1">Supports JPG, PNG, WEBP, HEIC</p>
          )}
        </div>
      </div>
    </div>
  );
};