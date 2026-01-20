import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppMode, PoseCategory, PoseVariant, AttireType, IdentityConfigState, WorkflowState } from './types';
import { DEFAULT_TIPS } from './constants';
import { Button } from './components/Button';
import { ImageUpload } from './components/ImageUpload';
import { Card } from './components/Card';
import { IdentityConfiguration } from './components/IdentityConfiguration';
import { Header } from './components/Header';
import { ImagePreview } from './components/ImagePreview';
import { ErrorBanner } from './components/ErrorBanner';
import { PromptInput } from './components/PromptInput';
import { OfferBoosterPanel } from './components/OfferBoosterPanel';
import { getRecommendedPresets } from './utils/smartMatch';

// Custom Hooks
import { useHistoryManager } from './hooks/useHistoryManager';
import { useImageProcessing } from './hooks/useImageProcessing';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.OFFER_BOOSTER);
  
  // Custom Hooks
  const historyMgr = useHistoryManager();
  const processor = useImageProcessing();

  // Local UI State
  const [isComparing, setIsComparing] = useState(false);
  const [identityConfig, setIdentityConfig] = useState<IdentityConfigState>({
    pose: { category: PoseCategory.NEUTRAL, variant: PoseVariant.A },
    attire: AttireType.SUIT,
    logoFile: null
  });
  const [employeePrompt, setEmployeePrompt] = useState('');
  const [selectedEnhancement, setSelectedEnhancement] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  // Cache for Analysis Results (File Name -> Analysis Result)
  // Implements "Analyze Once, Enhance Many"
  const analysisCache = useRef<Map<string, any>>(new Map());

  // API Key Check on Mount
  const [envCheckFailed, setEnvCheckFailed] = useState(false);
  useEffect(() => {
     if (!process.env.API_KEY) setEnvCheckFailed(true);
  }, []);

  // Derived Data
  const currentItem = historyMgr.currentItem;
  const selectedFile = currentItem?.file || null;
  const previewUrl = currentItem?.url || null;
  const originalUrl = historyMgr.history.length > 0 ? historyMgr.history[0].url : null;
  const analysisResult = currentItem?.analysis || null;
  const dynamicTips = currentItem?.tips || DEFAULT_TIPS;

  // Granular Status Message based on Workflow State
  const processingStatus = useMemo(() => {
    const { workflowState, activeOperation } = processor.processingState;
    if (workflowState === WorkflowState.PROCESSING) {
        switch (activeOperation) {
            case 'ANALYZING': return "Analyzing Visual Content...";
            case 'GENERATING': return "Generating Identity Variant...";
            case 'ENHANCING': return "Enhancing Aesthetics...";
            case 'EDITING': return "Applying Custom Edits...";
            default: return "Processing...";
        }
    }
    return null;
  }, [processor.processingState]);

  // Smart Recommendations
  const recommendedPresets = useMemo(() => {
    return getRecommendedPresets(analysisResult?.analysis);
  }, [analysisResult]);

  // --- Handlers ---

  const handleModeChange = (newMode: AppMode) => {
    if (processor.isBusy) return;
    setMode(newMode);
    // Note: We do NOT reset history entirely here to preserve the source image if possible, 
    // but the prompt implies strict separation. Let's reset for safety.
    historyMgr.resetHistory();
    processor.clearError();
    setEmployeePrompt('');
    setEditPrompt('');
    setSelectedEnhancement(null);
    setIdentityConfig({
        pose: { category: PoseCategory.NEUTRAL, variant: PoseVariant.A },
        attire: AttireType.SUIT,
        logoFile: null
    });
  };

  const runAnalysis = async (file: File, itemId: string) => {
    // Check Cache First
    const cacheKey = `${file.name}-${file.size}-${mode}`;
    if (analysisCache.current.has(cacheKey)) {
        console.log("Analysis cache hit");
        const cachedResult = analysisCache.current.get(cacheKey);
        historyMgr.updateHistoryItem(itemId, {
            analysis: cachedResult,
            tips: cachedResult.quick_edit_suggestions?.length > 0 ? cachedResult.quick_edit_suggestions : DEFAULT_TIPS
        });
        return;
    }

    const context = mode === AppMode.OFFER_BOOSTER 
        ? "TRAVEL_MARKETING" 
        : "IDENTITY_STANDARDIZATION";

    const result = await processor.processAnalysis(file, context);
    
    if (result) {
        // Cache the result
        analysisCache.current.set(cacheKey, result);

        historyMgr.updateHistoryItem(itemId, {
            analysis: result,
            tips: result.quick_edit_suggestions?.length > 0 ? result.quick_edit_suggestions : DEFAULT_TIPS
        });
    }
  };

  const handleFileSelect = async (file: File) => {
    if (historyMgr.history.length > 0) {
        historyMgr.resetHistory();
    }
    
    const newItemId = historyMgr.addToHistory(file);
    await runAnalysis(file, newItemId);
  };

  const handleGeneratedImage = async (base64Image: string, source: string) => {
    try {
        const res = await fetch(base64Image);
        const blob = await res.blob();
        const file = new File([blob], `${source}_${Date.now()}.png`, { type: "image/png" });
        const newItemId = historyMgr.addToHistory(file, undefined, 'GENERATED');
        
        // IMPORTANT: For generated images, we might NOT want to re-analyze fully immediately 
        // to save tokens, OR we do it to suggest next steps.
        // Rule: "Analyze once, enhance many".
        // However, a generated image is a NEW asset. 
        // We will perform analysis to update the feedback loop (Visual Suggestions).
        await runAnalysis(file, newItemId);
    } catch (e) {
        console.error("Failed to process generated image blob", e);
    }
  };

  const handleGenerateEmployee = async () => {
    // Identity Builder: Source Image is the Reference
    const referenceImage = historyMgr.history.length > 0 ? historyMgr.history[0].file : null;
    if (!referenceImage) return;

    const base64 = await processor.processGeneration(
        employeePrompt.trim(),
        identityConfig.logoFile,
        referenceImage,
        identityConfig.attire,
        identityConfig.pose
    );

    if (base64) {
        await handleGeneratedImage(base64, "identity");
    }
  };

  const handleEnhancement = async (presetId: string) => {
    if (!selectedFile) return;
    setSelectedEnhancement(presetId);

    const base64 = await processor.processEnhancement(selectedFile, presetId);
    if (base64) {
        await handleGeneratedImage(base64, "enhanced");
    }
  };

  const handleCustomEdit = async () => {
    if (!selectedFile || !editPrompt.trim()) return;
    
    const base64 = await processor.processEdit(selectedFile, editPrompt);
    if (base64) {
        await handleGeneratedImage(base64, "edited");
        setEditPrompt('');
    }
  };

  const handleResetToOriginal = () => {
    if (historyMgr.history.length > 0) {
        const originalFile = historyMgr.history[0].file;
        historyMgr.resetHistory();
        
        // Re-add original and re-attach cached analysis if available
        const newItemId = historyMgr.addToHistory(originalFile);
        
        const cacheKey = `${originalFile.name}-${originalFile.size}-${mode}`;
        if (analysisCache.current.has(cacheKey)) {
            const cachedResult = analysisCache.current.get(cacheKey);
            historyMgr.updateHistoryItem(newItemId, {
                analysis: cachedResult,
                tips: cachedResult.quick_edit_suggestions || DEFAULT_TIPS
            });
        }
    }
    setEditPrompt('');
    setSelectedEnhancement(null);
  };

  // Critical Error State
  if (processor.isApiKeyMissing || envCheckFailed) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
              <div className="bg-slate-800 border border-red-500/50 rounded-xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
                  <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                  </div>
                  <div>
                      <h1 className="text-xl font-bold text-white mb-2">Configuration Required</h1>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          The Google Gemini API Key is missing.
                          <br />
                          Check <code>process.env.API_KEY</code>.
                      </p>
                  </div>
                  <Button onClick={() => window.location.reload()} className="w-full">Retry</Button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-indigo-500/30 font-inter">
      <Header 
        mode={mode} 
        onModeChange={handleModeChange} 
        disabled={processor.isBusy} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Input & Config */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Identity Builder Header */}
            {mode === AppMode.IDENTITY_BUILDER && (
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl border border-indigo-500/30 shadow-lg flex items-center justify-between gap-4 sticky top-20 z-40 backdrop-blur-md">
                    <div>
                        <h2 className="text-base font-semibold text-white">Identity Builder</h2>
                        <p className="text-xs text-slate-400 hidden sm:block">Standardize employee portraits</p>
                    </div>
                    <Button 
                        onClick={handleGenerateEmployee} 
                        disabled={processor.isBusy || !selectedFile}
                        isLoading={processor.processingState.activeOperation === 'GENERATING'}
                        size="md"
                        className={`min-w-[140px] shadow-indigo-500/20 ${!selectedFile ? 'opacity-50' : ''}`}
                    >
                        {processor.processingState.activeOperation === 'GENERATING' ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
            )}

            {/* Upload Area */}
            <Card 
                title={mode === AppMode.IDENTITY_BUILDER ? "Reference Person (Required)" : "Upload Source Asset"}
                className={mode === AppMode.IDENTITY_BUILDER && !selectedFile ? "border-amber-500/40 ring-1 ring-amber-500/20 bg-amber-900/5" : ""}
            >
               <ImageUpload 
                  onFileSelect={handleFileSelect} 
                  isLoading={processor.isBusy} 
                  hasFile={!!selectedFile}
               />
            </Card>

            {/* Identity Configuration */}
            {mode === AppMode.IDENTITY_BUILDER && (
                <>
                    <IdentityConfiguration 
                        config={identityConfig}
                        onConfigChange={(updates) => setIdentityConfig(prev => ({ ...prev, ...updates }))}
                        isLoading={processor.isBusy}
                        disabled={processor.isBusy} 
                    />
                    <div className={`transition-opacity duration-300 ${processor.isBusy ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                      <Card className="border-indigo-500/10 bg-indigo-900/5">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Refinements</label>
                        </div>
                        <PromptInput 
                           value={employeePrompt}
                           onChange={setEmployeePrompt}
                           onSubmit={handleGenerateEmployee}
                           isLoading={processor.isBusy}
                           placeholder="E.g. 'Add glasses', 'Smile more'..."
                           buttonLabel="Generate"
                           variant="default"
                        />
                      </Card>
                    </div>
                </>
            )}

            {/* Offer Booster Panel */}
            {mode === AppMode.OFFER_BOOSTER && (
               <OfferBoosterPanel
                  selectedFile={selectedFile}
                  analysisResult={analysisResult}
                  selectedEnhancement={selectedEnhancement}
                  onEnhance={handleEnhancement}
                  isLoading={processor.isBusy}
                  recommendedPresets={recommendedPresets}
                  onReset={handleResetToOriginal}
                  hasHistory={historyMgr.history.length > 1}
               />
            )}

            <ErrorBanner message={processor.error} onClose={processor.clearError} />
          </div>

          {/* RIGHT COLUMN: Preview & Results & Custom Edit */}
          <div className="lg:col-span-7">
              <ImagePreview 
                  previewUrl={previewUrl}
                  originalUrl={originalUrl}
                  analysisResult={analysisResult}
                  mode={mode}
                  isComparing={isComparing}
                  setIsComparing={setIsComparing}
                  canUndo={historyMgr.canUndo}
                  onUndo={historyMgr.undo}
                  canRedo={historyMgr.canRedo}
                  onRedo={historyMgr.redo}
                  editPrompt={editPrompt}
                  setEditPrompt={setEditPrompt}
                  onApplyCustomEdit={handleCustomEdit}
                  selectedFile={selectedFile}
                  processingStatus={processingStatus}
                  tips={dynamicTips}
                  workflowState={processor.processingState.workflowState}
              />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;