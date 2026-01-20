import React from 'react';
import { VisualAnalysisResult, AppMode, WorkflowState } from '../types';
import { AnalysisResultView } from './AnalysisResultView';
import { CustomEditPanel } from './CustomEditPanel';

interface ImagePreviewProps {
  previewUrl: string | null;
  originalUrl: string | null;
  analysisResult: VisualAnalysisResult | null;
  mode: AppMode;
  isComparing: boolean;
  setIsComparing: (v: boolean) => void;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  editPrompt: string;
  setEditPrompt: (val: string) => void;
  onApplyCustomEdit: () => void;
  selectedFile: File | null;
  processingStatus: string | null;
  tips: string[];
  workflowState?: WorkflowState;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  previewUrl,
  originalUrl,
  analysisResult,
  mode,
  isComparing,
  setIsComparing,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  editPrompt,
  setEditPrompt,
  onApplyCustomEdit,
  selectedFile,
  processingStatus,
  tips,
  workflowState
}) => {
  
  const isLoading = !!processingStatus;
  const activeImage = isComparing && originalUrl ? originalUrl : previewUrl;

  const handleCompareKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsComparing(true);
    }
  };

  const handleCompareKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsComparing(false);
    }
  };

  if (!previewUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30 min-h-[500px] text-slate-600 space-y-6 animate-fade-in p-8">
          <div className="relative">
              <div className="w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 transition-transform duration-500 hover:rotate-0">
                 <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
              </div>
          </div>
          <div className="text-center max-w-sm">
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Ready to Visualize</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                  Upload a source image from the panel on the left to begin the analysis and transformation process.
              </p>
          </div>
      </div>
    );
  }

  // Determine Badge Text & Color based on WorkflowState or Compare Mode
  let badgeText = "SOURCE INPUT";
  let badgeColor = "bg-black/70";

  if (isComparing) {
      badgeText = "ORIGINAL SOURCE";
      badgeColor = "bg-amber-600/90";
  } else if (isLoading) {
      badgeText = "PROCESSING...";
      badgeColor = "bg-indigo-600/50 animate-pulse";
  } else if (workflowState === WorkflowState.RESULT_READY) {
      if (mode === AppMode.IDENTITY_BUILDER) {
          badgeText = "GENERATED IDENTITY";
          badgeColor = "bg-indigo-600/90";
      } else {
          badgeText = canUndo ? "ENHANCED RESULT" : "ANALYZED SOURCE";
          badgeColor = canUndo ? "bg-emerald-600/90" : "bg-black/70";
      }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shadow-2xl">
        <div className="w-full h-auto min-h-[400px] flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0iIzFFMjlMMyIgZD0iTTAgMGgyMHYyMEgwVjB6Ii8+PHBhdGggZmlsbD0iIzFGKzkyIiBkPSJNMCAwaDEwdjEwSDBWMHptMTAgMTBoMTB2MTBIMTBWMTB6Ii8+PC9zdmc+')]">
            <img 
            src={activeImage || ''} 
            alt="Preview" 
            className="w-full h-auto max-h-[650px] object-contain mx-auto transition-all duration-200"
            />
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <span className={`backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 shadow-xl ${badgeColor}`}>
            {badgeText}
          </span>
        </div>

        {/* UNDO / REDO CONTROLS */}
        {!isLoading && !isComparing && (
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`bg-black/50 backdrop-blur-md border border-white/20 text-white p-2 rounded-full hover:bg-black/70 active:scale-95 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!canUndo ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Undo"
            >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
               </svg>
            </button>
            
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`bg-black/50 backdrop-blur-md border border-white/20 text-white p-2 rounded-full hover:bg-black/70 active:scale-95 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!canRedo ? 'opacity-30 cursor-not-allowed' : ''}`}
              title="Redo"
            >
               <svg className="w-5 h-5 transform scale-x-[-1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
               </svg>
            </button>
          </div>
        )}

        {/* COMPARE BUTTON */}
        {canUndo && !isLoading && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
            <button
              onMouseDown={() => setIsComparing(true)}
              onMouseUp={() => setIsComparing(false)}
              onMouseLeave={() => setIsComparing(false)}
              onTouchStart={() => setIsComparing(true)}
              onTouchEnd={() => setIsComparing(false)}
              onKeyDown={handleCompareKeyDown}
              onKeyUp={handleCompareKeyUp}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full font-semibold text-sm hover:bg-white/20 active:scale-95 transition-all shadow-lg select-none flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
               </svg>
               Hold to Compare
            </button>
          </div>
        )}
      </div>

      {/* Manual Edit Panel - Always visible under image for Offer Booster */}
      {mode === AppMode.OFFER_BOOSTER && selectedFile && (
         <CustomEditPanel 
             editPrompt={editPrompt}
             setEditPrompt={setEditPrompt}
             isLoading={isLoading}
             onApply={onApplyCustomEdit}
             tips={tips}
         />
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-pulse">
           <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           <div className="text-center">
             <p className="text-slate-300 font-medium text-lg">{processingStatus}</p>
             <p className="text-slate-500 text-sm mt-1">Powered by Gemini 2.5</p>
           </div>
        </div>
      )}

      {analysisResult && !isLoading && (
        <AnalysisResultView result={analysisResult} />
      )}
    </div>
  );
};