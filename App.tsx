import React, { useState } from 'react';
import { AppMode, VisualAnalysisResult } from './types';
import { analyzeImage, generateEmployeeImage } from './services/geminiService';
import { Button } from './components/Button';
import { ImageUpload } from './components/ImageUpload';
import { AnalysisResultView } from './components/AnalysisResultView';
import { Card } from './components/Card';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.OFFER_BOOSTER);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VisualAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [employeePrompt, setEmployeePrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    // Reset state on mode switch
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setError(null);
    setEmployeePrompt('');
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    try {
      const context = mode === AppMode.OFFER_BOOSTER 
        ? "Hotel and Landscape Enhancement (Offer Booster)" 
        : "Employee Identity Standardization (Identity Builder)";
      
      const result = await analyzeImage(selectedFile, context);
      setAnalysisResult(result);
    } catch (err) {
      setError("Failed to analyze image. Please check your API key or try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateEmployee = async () => {
    if (!employeePrompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);

    try {
      const base64Image = await generateEmployeeImage(employeePrompt);
      setPreviewUrl(base64Image);
      
      // Convert base64 to File object for analysis
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const file = new File([blob], "generated_employee.png", { type: "image/png" });
      setSelectedFile(file);

      // Auto-analyze the generated image
      const context = "Employee Identity Standardization (Identity Builder) - Generated Image Verification";
      const analysis = await analyzeImage(file, context);
      setAnalysisResult(analysis);

    } catch (err) {
      setError("Failed to generate or analyze image. Ensure your API key supports Gemini 2.5 Flash Image.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
              Automate Travel <span className="font-light text-slate-500">| AI Visual Suite</span>
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
          <div className="lg:col-span-5 space-y-6">
            <div className="prose prose-invert">
              <h2 className="text-2xl font-light text-white">
                {mode === AppMode.OFFER_BOOSTER ? 'Enhance Visual Assets' : 'Standardize Identity'}
              </h2>
              <p className="text-slate-400">
                {mode === AppMode.OFFER_BOOSTER 
                  ? 'Upload hotel or landscape imagery for AI-driven lighting and atmospheric enhancement suggestions.' 
                  : 'Generate or upload employee portraits to verify compliance with corporate visual identity standards.'}
              </p>
            </div>

            {mode === AppMode.IDENTITY_BUILDER && (
               <Card className="border-indigo-500/30 bg-indigo-900/10">
                 <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-2">Generative Mode</h3>
                 <div className="space-y-3">
                   <textarea 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      rows={3}
                      placeholder="Describe the employee (e.g., 'A professional woman in a grey suit standing in a modern office lobby')"
                      value={employeePrompt}
                      onChange={(e) => setEmployeePrompt(e.target.value)}
                   />
                   <Button 
                    onClick={handleGenerateEmployee} 
                    disabled={!employeePrompt.trim()}
                    isLoading={isLoading}
                    className="w-full"
                   >
                     Generate & Analyze Identity
                   </Button>
                   <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                     <span className="w-2 h-2 rounded-full bg-green-500"></span>
                     Powered by Gemini 2.5 Flash Image
                   </div>
                 </div>
               </Card>
            )}

            <Card title="Upload Source">
               <ImageUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
            </Card>

            {selectedFile && !isLoading && !analysisResult && (
               <Button onClick={handleAnalyze} className="w-full" size="lg">
                 Run Visual Analysis
               </Button>
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
                <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-auto max-h-[500px] object-contain mx-auto"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 shadow-xl">
                      SOURCE INPUT
                    </span>
                  </div>
                </div>

                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-pulse">
                     <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-slate-400 font-mono text-sm">Processing constraints & attributes...</p>
                  </div>
                )}

                {analysisResult && (
                  <AnalysisResultView result={analysisResult} />
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50 min-h-[400px]">
                <div className="text-center text-slate-600">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>Select an image or generate one to begin analysis</p>
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