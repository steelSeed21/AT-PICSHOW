import React, { useState, useRef } from 'react';
import { AppMode, VisualAnalysisResult, PoseCategory, PoseVariant, AttireType } from './types';
import { analyzeImage, generateEmployeeImage, editImage, checkTransparency, removeBackground, enhanceImage } from './services/geminiService';
import { Button } from './components/Button';
import { ImageUpload } from './components/ImageUpload';
import { AnalysisResultView } from './components/AnalysisResultView';
import { Card } from './components/Card';
import { PoseSelector } from './components/PoseSelector';
import { AttireSelector } from './components/AttireSelector';

// --- VISUAL ASSETS & PRESETS ---

const ENHANCEMENT_PRESETS = [
  {
    id: "golden_hour",
    label: "Golden Hour",
    prompt: "Enhance this image with warm golden hour lighting, soft shadows, and a welcoming sunset atmosphere. Make it look inviting and premium.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    id: "modern_bright",
    label: "Modern & Bright",
    prompt: "Brighten the image with clean, natural white lighting. Increase clarity, reduce noise, and make the space feel airy and modern. Professional interior photography style.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    id: "declutter",
    label: "Clean & Tidy",
    prompt: "Digitally remove clutter and imperfections. Smooth out surfaces, balance the exposure, and make the image look like a polished, professional brochure photo.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    )
  }
];

const DEFAULT_TIPS = [
  "Improve lighting",
  "Enhance colors",
  "Remove clutter"
];

interface HistoryItem {
  file: File;
  url: string;
  analysis: VisualAnalysisResult | null;
  tips: string[];
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.OFFER_BOOSTER);
  
  // History State replacing individual state variables
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  const [isComparing, setIsComparing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [employeePrompt, setEmployeePrompt] = useState('');
  
  // Derived state
  const currentItem = historyIndex >= 0 ? history[historyIndex] : null;
  const originalItem = history.length > 0 ? history[0] : null;
  
  const selectedFile = currentItem?.file || null;
  const previewUrl = currentItem?.url || null;
  const originalPreviewUrl = originalItem?.url || null;
  const analysisResult = currentItem?.analysis || null;
  const dynamicTips = currentItem?.tips || DEFAULT_TIPS;

  // Identity Builder State
  const [configTab, setConfigTab] = useState<'pose' | 'attire' | 'logo'>('pose');
  const [selectedPose, setSelectedPose] = useState<{
    category: PoseCategory;
    variant: PoseVariant;
  }>({
    category: PoseCategory.NEUTRAL,
    variant: PoseVariant.A
  });
  
  const [selectedAttire, setSelectedAttire] = useState<AttireType>(AttireType.SUIT);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Offer Booster Preset State
  const [selectedEnhancement, setSelectedEnhancement] = useState<string | null>(null);

  // Custom Edit State
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    resetState();
  };

  const resetState = () => {
    setHistory([]);
    setHistoryIndex(-1);
    setError(null);
    setEmployeePrompt('');
    setEditPrompt('');
    setIsEditing(false);
    // Reset presets
    setSelectedPose({
      category: PoseCategory.NEUTRAL,
      variant: PoseVariant.A
    });
    setSelectedAttire(AttireType.SUIT);
    setSelectedEnhancement(null);
    // Reset logo
    setLogoFile(null);
    setConfigTab('pose');
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
      setError("Failed to analyze image. Please check your API key or try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
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
    const url = base64Image;

    const newItem: HistoryItem = {
      file: file,
      url: url,
      analysis: null,
      tips: DEFAULT_TIPS
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newItem);
      return newHistory;
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
      // Pass the raw employeePrompt directly - the service now handles empty strings intelligently
      // to fallback to reference image identity if available.
      const basePrompt = employeePrompt.trim(); 
      
      const base64Image = await generateEmployeeImage(
        basePrompt,
        logoFile,
        referenceImage,
        selectedAttire,
        selectedPose
      );

      await processGeneratedImage(base64Image, "generated");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to generate image.";
      if (errorMessage.includes("safety") || errorMessage.includes("blocked")) {
         setError("Generation blocked by safety settings. Try a different reference photo or prompt.");
      } else {
         setError(errorMessage);
      }
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
      setError("Failed to enhance image. Ensure your API key supports Gemini 2.5 Flash Image.");
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

  const addSuggestion = (suggestion: string) => {
    setEditPrompt((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return suggestion;
      if (trimmed.endsWith(',')) return `${trimmed} ${suggestion}`;
      return `${trimmed}, ${suggestion}`;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  };

  const hasEdits = historyIndex > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
               <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
               </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Automate Travel <span className="font-light text-slate-500">| AI Visual Suite v2</span>
            </h1>
          </div>
          <nav className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => handleModeChange(AppMode.OFFER_BOOSTER)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === AppMode.OFFER_BOOSTER 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Offer Booster
            </button>
            <button
              onClick={() => handleModeChange(AppMode.IDENTITY_BUILDER)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === AppMode.IDENTITY_BUILDER 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Identity Builder
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* 1. Action Bar - Top Priority */}
            {mode === AppMode.IDENTITY_BUILDER && (
                <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-indigo-500/30 shadow-lg sticky top-20 z-40">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-white">Identity Builder</h2>
                            <p className="text-xs text-slate-400">Generate standardized portrait from reference</p>
                        </div>
                        <Button 
                            onClick={handleGenerateEmployee} 
                            disabled={isLoading || !selectedFile}
                            isLoading={isLoading}
                            size="md"
                            className={`min-w-[160px] ${!selectedFile ? 'opacity-50' : 'animate-pulse-subtle'}`}
                        >
                            {isLoading ? 'Processing...' : 'Generate Portrait'}
                        </Button>
                    </div>
                    {!selectedFile && (
                        <div className="mt-2 text-xs text-amber-400 font-medium bg-amber-900/20 px-3 py-1.5 rounded border border-amber-900/50 flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Reference image required
                        </div>
                    )}
                </div>
            )}

            {/* 2. Mandatory Upload */}
            <Card 
                title={mode === AppMode.IDENTITY_BUILDER ? "Reference Person (Mandatory)" : "Upload Source"}
                className={mode === AppMode.IDENTITY_BUILDER && !selectedFile ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : ""}
            >
               <ImageUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
               {mode === AppMode.IDENTITY_BUILDER && (
                   <p className="text-xs text-slate-500 mt-2 text-center">
                       Upload a clear photo of the employee to preserve their identity.
                   </p>
               )}
            </Card>

            {/* IDENTITY BUILDER CONFIGURATION TABS */}
            {mode === AppMode.IDENTITY_BUILDER && (
               <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                 {/* Tabs Header */}
                 <div className="flex border-b border-slate-700">
                    <button 
                        onClick={() => setConfigTab('pose')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${configTab === 'pose' ? 'border-indigo-500 text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                    >
                        Pose
                    </button>
                    <button 
                        onClick={() => setConfigTab('attire')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${configTab === 'attire' ? 'border-purple-500 text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                    >
                        Attire
                    </button>
                    <button 
                        onClick={() => setConfigTab('logo')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${configTab === 'logo' ? 'border-pink-500 text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                    >
                        Logo
                    </button>
                 </div>

                 {/* Tab Content */}
                 <div className="p-4 bg-slate-900/30">
                     {configTab === 'pose' && (
                        <div className="animate-fade-in">
                             <PoseSelector
                                selectedCategory={selectedPose.category}
                                selectedVariant={selectedPose.variant}
                                onPoseChange={(cat, variant) => setSelectedPose({ category: cat, variant })}
                                disabled={isLoading}
                             />
                        </div>
                     )}

                     {configTab === 'attire' && (
                        <div className="animate-fade-in">
                            <AttireSelector
                                selected={selectedAttire}
                                onAttireChange={setSelectedAttire}
                                disabled={isLoading}
                            />
                        </div>
                     )}

                     {configTab === 'logo' && (
                        <div className="animate-fade-in space-y-4">
                            <div className="p-4 bg-pink-900/10 border border-pink-500/20 rounded-lg">
                                <h4 className="text-sm font-medium text-pink-300 mb-2">Company Branding</h4>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setLogoFile(file);
                                        }}
                                        disabled={isLoading}
                                        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-500/20 file:text-pink-300 hover:file:bg-pink-500/30 file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            
                            {logoFile ? (
                                <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg">
                                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden border border-slate-700">
                                        <img 
                                            src={URL.createObjectURL(logoFile)} 
                                            alt="Logo preview" 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white truncate">{logoFile.name}</div>
                                        <div className="text-xs text-slate-500">Ready for integration</div>
                                    </div>
                                    <button onClick={() => setLogoFile(null)} className="text-slate-400 hover:text-white">✕</button>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-500 text-center py-4 border-2 border-dashed border-slate-800 rounded-lg">
                                    No logo selected. Standard attire will be generated.
                                </div>
                            )}
                        </div>
                     )}
                 </div>
               </div>
            )}

            {/* Optional Description (Collapsed or Minimal) */}
            {mode === AppMode.IDENTITY_BUILDER && (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <h3 className="text-sm font-medium text-slate-300">Additional Details (Optional)</h3>
                    </div>
                    <textarea 
                       className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
                       rows={2}
                       placeholder="E.g. 'Add glasses', 'Make lighting warmer'..."
                       value={employeePrompt}
                       onChange={(e) => setEmployeePrompt(e.target.value)}
                       disabled={isLoading}
                     />
                </div>
            )}

            {/* OFFER BOOSTER CONTROLS (Existing logic kept simpler) */}
            {mode === AppMode.OFFER_BOOSTER && selectedFile && (
               <div className="space-y-4">
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
                                {preset.icon}
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

                 {/* RESTRICTED CUSTOM PROMPT */}
                 <Card className="border-slate-700 bg-slate-800/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Restricted Custom Edit</h3>
                      <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full border border-slate-600">Strict Constraints Active</span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-2">Smart Tips (Auto-generated from image):</p>
                      <div className="flex flex-wrap gap-2">
                        {dynamicTips.map((chip, idx) => {
                          const isSelected = editPrompt.includes(chip);
                          return (
                            <button
                                key={idx}
                                onClick={() => addSuggestion(chip)}
                                className={`text-xs px-3 py-1 rounded-full transition-all animate-fade-in border ${
                                    isSelected 
                                    ? 'bg-indigo-600 text-white border-indigo-500' 
                                    : 'bg-indigo-900/40 hover:bg-indigo-600 hover:text-white text-indigo-200 border-indigo-700/50 hover:border-indigo-500'
                                }`}
                                disabled={isLoading}
                            >
                                {isSelected ? '✓ ' : '+ '}{chip}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <textarea 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-600 font-mono"
                        rows={2}
                        placeholder="Describe specific adjustments (e.g. 'remove glare', 'warmer lights')..."
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                      />
                      <Button 
                        onClick={handleCustomEdit} 
                        disabled={!editPrompt.trim()} 
                        isLoading={isLoading}
                        variant="secondary"
                        className="w-full"
                        size="sm"
                      >
                        Generate Custom Edit
                      </Button>
                      <p className="text-[10px] text-slate-500 text-center leading-tight">
                        Note: AI will prioritize professional integrity. Requests conflicting with travel/corporate standards will be ignored.
                      </p>
                    </div>
                 </Card>
               </div>
            )}

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Visualization & Results */}
          <div className="lg:col-span-7 space-y-6">
            {previewUrl ? (
              <div className="space-y-6">
                <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shadow-2xl">
                  <img 
                    src={isComparing && originalPreviewUrl ? originalPreviewUrl : previewUrl} 
                    alt="Preview" 
                    className="w-full h-auto max-h-[600px] object-contain mx-auto transition-all duration-200"
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 shadow-xl ${
                        isComparing ? 'bg-amber-600/90' : (mode === AppMode.IDENTITY_BUILDER && !analysisResult ? 'bg-indigo-600/90' : 'bg-black/70')
                    }`}>
                      {isComparing ? 'ORIGINAL SOURCE' : (mode === AppMode.IDENTITY_BUILDER && !analysisResult ? 'GENERATED IDENTITY' : (hasEdits ? 'ENHANCED RESULT' : 'SOURCE INPUT'))}
                    </span>
                  </div>

                  {/* UNDO BUTTON (Top Right) */}
                  {historyIndex > 0 && !isLoading && !isComparing && (
                    <div className="absolute top-4 right-4 z-20">
                      <button
                        onClick={handleUndo}
                        className="bg-black/50 backdrop-blur-md border border-white/20 text-white p-2 rounded-full hover:bg-black/70 active:scale-95 transition-all shadow-lg group-undo"
                        title="Undo last change"
                      >
                         <svg className="w-5 h-5 text-slate-200 group-undo-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                         </svg>
                      </button>
                    </div>
                  )}

                  {/* COMPARE BUTTON OVERLAY */}
                  {hasEdits && !isLoading && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
                      <button
                        onMouseDown={() => setIsComparing(true)}
                        onMouseUp={() => setIsComparing(false)}
                        onMouseLeave={() => setIsComparing(false)}
                        onTouchStart={() => setIsComparing(true)}
                        onTouchEnd={() => setIsComparing(false)}
                        className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full font-semibold text-sm hover:bg-white/20 active:scale-95 transition-all shadow-lg select-none flex items-center gap-2"
                      >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                         </svg>
                         Hold to Compare
                      </button>
                    </div>
                  )}
                  
                  {/* Edit Controls Overlay */}
                  {mode !== AppMode.OFFER_BOOSTER && !isEditing && !isLoading && selectedFile && (
                     <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" onClick={() => setIsEditing(true)}>
                           Custom Edit
                        </Button>
                     </div>
                  )}
                </div>

                {isEditing && mode !== AppMode.OFFER_BOOSTER && (
                  <Card title="Custom Edit (Gemini 2.5)" className="border-amber-500/30 bg-amber-900/10 animate-fade-in">
                    <div className="space-y-3">
                      <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        rows={2}
                        placeholder="Describe the edit (e.g., 'Change the tie to blue', 'Add a company logo on the chest')"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleCustomEdit} disabled={!editPrompt.trim()} isLoading={isLoading}>
                          Apply Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-pulse">
                     <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-slate-400 font-mono text-sm">Processing with Gemini 2.5...</p>
                  </div>
                )}

                {analysisResult && !isEditing && (
                  <AnalysisResultView result={analysisResult} />
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50 min-h-[400px]">
                <div className="text-center text-slate-600">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>Select a reference image or generate one to begin</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;