import React, { useState, useEffect, useRef } from 'react';
import { AppMode, PoseCategory, PoseVariant, AttireType, HistoryItem, IdentityConfigState } from './types';
import { analyzeImage, generateEmployeeImage, editImage, enhanceImage } from './services/geminiService';
import { ENHANCEMENT_PRESETS, DEFAULT_TIPS } from './constants';
import { Button } from './components/Button';
import { ImageUpload } from './components/ImageUpload';
import { Card } from './components/Card';
import { IdentityConfiguration } from './components/IdentityConfiguration';
import { Header } from './components/Header';
import { ImagePreview } from './components/ImagePreview';
import { CustomEditPanel } from './components/CustomEditPanel';
import { ErrorBanner } from './components/ErrorBanner';
import { PromptInput } from './components/PromptInput';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.OFFER_BOOSTER);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  // UI State
  const [isComparing, setIsComparing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Identity Configuration State (Grouped)
  const [identityConfig, setIdentityConfig] = useState<IdentityConfigState>({
    pose: { category: PoseCategory.NEUTRAL, variant: PoseVariant.A },
    attire: AttireType.SUIT,
    logoFile: null
  });
  
  const [employeePrompt, setEmployeePrompt] = useState('');

  // Offer Booster State
  const [selectedEnhancement, setSelectedEnhancement] = useState<string | null>(null);

  // Custom Edit State
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Derived state
  const currentItem = historyIndex >= 0 ? history[historyIndex] : null;
  const selectedFile = currentItem?.file || null;
  const previewUrl = currentItem?.url || null;
  const originalPreviewUrl = history.length > 0 ? history[0]?.url : null;
  const analysisResult = currentItem?.analysis || null;
  const dynamicTips = currentItem?.tips || DEFAULT_TIPS;

  // Cleanup Ref to track history items without stale closures
  const historyRef = useRef<HistoryItem[]>(history);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Cleanup effect for ObjectURLs on unmount
  useEffect(() => {
    return () => {
      if (historyRef.current) {
        historyRef.current.forEach(item => {
          if (item.url.startsWith('blob:')) {
            URL.revokeObjectURL(item.url);
          }
        });
      }
    };
  }, []);

  const cleanupItems = (items: HistoryItem[]) => {
    items.forEach(item => {
        if (item.url.startsWith('blob:')) {
            URL.revokeObjectURL(item.url);
        }
    });
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    cleanupItems(history);
    setHistory([]);
    setHistoryIndex(-1);
    setError(null);
    setEmployeePrompt('');
    setEditPrompt('');
    setIsEditing(false);
    setSelectedEnhancement(null);
    // Reset Identity Config
    setIdentityConfig({
        pose: { category: PoseCategory.NEUTRAL, variant: PoseVariant.A },
        attire: AttireType.SUIT,
        logoFile: null
    });
  };

  // Run analysis and update a specific history item
  const performAnalysisAndUpdateHistory = async (file: File, targetIndex: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const context = mode === AppMode.OFFER_BOOSTER 
        ? "Hotel and Landscape Enhancement (Offer Booster)" 
        : "Employee Identity Standardization (Identity Builder)";
      
      const result = await analyzeImage(file, context);
      
      setHistory(prev => {
        const newHistory = [...prev];
        if (newHistory[targetIndex]) {
          newHistory[targetIndex] = {
            ...newHistory[targetIndex],
            analysis: result,
            tips: result.quick_edit_suggestions?.length > 0 ? result.quick_edit_suggestions : DEFAULT_TIPS
          };
        }
        return newHistory;
      });
      
    } catch (err) {
      setError("Failed to analyze image. Please check your API key.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    // If replacing the source (index 0), cleanup the old source URL
    if (history.length > 0) {
        cleanupItems(history);
    }

    const url = URL.createObjectURL(file);
    const newItem: HistoryItem = {
      file: file,
      url: url,
      analysis: null,
      tips: DEFAULT_TIPS
    };
    
    // Reset history with new file
    setHistory([newItem]);
    setHistoryIndex(0);
    setError(null);
    setIsEditing(false);
    setSelectedEnhancement(null);

    // Analyze the new file (index 0)
    performAnalysisAndUpdateHistory(file, 0);
  };

  const processGeneratedImage = async (base64Image: string, source: "generated" | "edited") => {
    // Convert base64 to File object
    const res = await fetch(base64Image);
    const blob = await res.blob();
    const file = new File([blob], `${source}_image.png`, { type: "image/png" });
    const url = URL.createObjectURL(blob); // Track this URL for cleanup

    const newItem: HistoryItem = {
      file: file,
      url: url,
      analysis: null,
      tips: DEFAULT_TIPS
    };

    setHistory(prev => {
      // Discard "future" history if we were in the middle of the stack
      const keptHistory = prev.slice(0, historyIndex + 1);
      // Cleanup discarded items
      const discarded = prev.slice(historyIndex + 1);
      cleanupItems(discarded);
      
      return [...keptHistory, newItem];
    });
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    
    performAnalysisAndUpdateHistory(file, newIndex);
  };

  const handleGenerateEmployee = async () => {
    setIsLoading(true);
    setError(null);
    // Use selectedFile (from History) as the reference image if it exists
    const referenceImage = mode === AppMode.IDENTITY_BUILDER ? selectedFile : null;
    
    if (!referenceImage) {
        setError("Reference image is required for Identity Builder.");
        return;
    }

    try {
      const basePrompt = employeePrompt.trim(); 
      const base64Image = await generateEmployeeImage(
        basePrompt,
        identityConfig.logoFile,
        referenceImage,
        identityConfig.attire,
        identityConfig.pose
      );
      await processGeneratedImage(base64Image, "generated");
    } catch (err: any) {
      setError(err.message || "Generation failed.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhancement = async (presetId: string) => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    setSelectedEnhancement(presetId);

    try {
      const base64Image = await enhanceImage(selectedFile, presetId as 'golden_hour' | 'declutter' | 'modern_bright');
      await processGeneratedImage(base64Image, "edited");
    } catch (err: any) {
      setError("Failed to enhance image.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCustomEdit = async () => {
    if (!selectedFile || !editPrompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setSelectedEnhancement(null);
    
    try {
      const base64Image = await editImage(selectedFile, editPrompt);
      await processGeneratedImage(base64Image, "edited");
      setIsEditing(false);
      setEditPrompt('');
    } catch (err: any) {
      setError("Failed to edit image.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  };

  const hasEdits = historyIndex > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-indigo-500/30 font-inter">
      <Header mode={mode} onModeChange={handleModeChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Input & Configuration */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* 1. PRIMARY ACTION BAR (Visible Top) */}
            {mode === AppMode.IDENTITY_BUILDER && (
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl border border-indigo-500/30 shadow-lg flex items-center justify-between gap-4 sticky top-20 z-40 backdrop-blur-md">
                    <div>
                        <h2 className="text-base font-semibold text-white">Identity Builder</h2>
                        <p className="text-xs text-slate-400 hidden sm:block">Standardize employee portraits</p>
                    </div>
                    <Button 
                        onClick={handleGenerateEmployee} 
                        disabled={isLoading || !selectedFile}
                        isLoading={isLoading}
                        size="md"
                        className={`min-w-[140px] shadow-indigo-500/20 ${!selectedFile ? 'opacity-50' : ''}`}
                    >
                        {isLoading ? 'Processing...' : 'Generate'}
                    </Button>
                </div>
            )}

            {/* 2. UPLOAD CARD (Mandatory for Identity Builder) */}
            <Card 
                title={mode === AppMode.IDENTITY_BUILDER ? "Reference Person (Required)" : "Upload Source Asset"}
                className={mode === AppMode.IDENTITY_BUILDER && !selectedFile ? "border-amber-500/40 ring-1 ring-amber-500/20 bg-amber-900/5" : ""}
            >
               <ImageUpload 
                  onFileSelect={handleFileSelect} 
                  isLoading={isLoading} 
                  hasFile={!!selectedFile}
               />
               {mode === AppMode.IDENTITY_BUILDER && !selectedFile && (
                   <div className="flex items-center justify-center gap-2 mt-3 text-amber-400 text-xs font-medium animate-pulse-subtle">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                       </svg>
                       Upload reference photo to unlock configuration
                   </div>
               )}
            </Card>

            {/* 3. IDENTITY CONFIGURATION (Tabs) - Only visible in Identity Mode */}
            {mode === AppMode.IDENTITY_BUILDER && (
                <>
                    <IdentityConfiguration 
                        config={identityConfig}
                        onConfigChange={(updates) => setIdentityConfig(prev => ({ ...prev, ...updates }))}
                        isLoading={isLoading}
                        disabled={!selectedFile}
                    />

                    {/* Optional Prompt Details using standardized PromptInput */}
                    <div className={`transition-opacity duration-300 ${!selectedFile ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                      <Card className="border-indigo-500/10 bg-indigo-900/5">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Refinements (Optional)</label>
                        </div>
                        <PromptInput 
                           value={employeePrompt}
                           onChange={setEmployeePrompt}
                           onSubmit={handleGenerateEmployee}
                           isLoading={isLoading}
                           placeholder="E.g. 'Add glasses', 'Make lighting warmer', 'Smile more'..."
                           buttonLabel="Generate with Refinements"
                           variant="default"
                        />
                      </Card>
                    </div>
                </>
            )}

            {/* 4. OFFER BOOSTER CONTROLS (Only in Offer Booster Mode) */}
            {mode === AppMode.OFFER_BOOSTER && selectedFile && (
               <div className="space-y-4 animate-fade-in">
                 <Card className="border-indigo-500/30 bg-indigo-900/10">
                    <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-4">Auto-Enhance Presets</h3>
                    <div className="grid grid-cols-2 gap-3">
                       {ENHANCEMENT_PRESETS.map((preset) => (
                          <button
                             key={preset.id}
                             onClick={() => handleEnhancement(preset.id)}
                             disabled={isLoading}
                             className={`flex items-center gap-3 p-3 border rounded-lg transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed ${
                                selectedEnhancement === preset.id
                                  ? 'bg-indigo-900/30 border-indigo-500 shadow-lg shadow-indigo-500/20'
                                  : 'bg-slate-800/80 border-slate-700 hover:bg-indigo-900/40 hover:border-indigo-500/50'
                             }`}
                          >
                             <div className={`${selectedEnhancement === preset.id ? 'text-indigo-300' : 'text-indigo-400 group-hover:text-indigo-300'}`}>
                                {/* Simple Icon rendering based on preset.iconName */}
                                {preset.iconName === 'sun' && (
                                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                )}
                                {preset.iconName === 'sparkles' && (
                                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                )}
                                {preset.iconName === 'magic' && (
                                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                )}
                             </div>
                             <div>
                                <div className={`text-sm font-medium ${selectedEnhancement === preset.id ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                                    {preset.label}
                                </div>
                             </div>
                          </button>
                       ))}
                    </div>
                 </Card>

                 <CustomEditPanel 
                    editPrompt={editPrompt}
                    setEditPrompt={setEditPrompt}
                    isLoading={isLoading}
                    onApply={handleCustomEdit}
                    tips={dynamicTips}
                 />
               </div>
            )}

            <ErrorBanner message={error} onClose={() => setError(null)} />
          </div>

          {/* RIGHT COLUMN: Visualization & Results */}
          <div className="lg:col-span-7">
              <ImagePreview 
                  previewUrl={previewUrl}
                  originalUrl={originalPreviewUrl}
                  analysisResult={analysisResult}
                  mode={mode}
                  isLoading={isLoading}
                  isComparing={isComparing}
                  setIsComparing={setIsComparing}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  hasEdits={hasEdits}
                  onUndo={handleUndo}
                  editPrompt={editPrompt}
                  setEditPrompt={setEditPrompt}
                  onApplyCustomEdit={handleCustomEdit}
                  selectedFile={selectedFile}
              />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;