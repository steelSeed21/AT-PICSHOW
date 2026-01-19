import React, { useState } from 'react';
import { IdentityConfigState } from '../types';
import { PoseSelector } from './PoseSelector';
import { AttireSelector } from './AttireSelector';
import { ImageUpload } from './ImageUpload';

interface IdentityConfigurationProps {
  config: IdentityConfigState;
  onConfigChange: (updates: Partial<IdentityConfigState>) => void;
  isLoading: boolean;
  disabled: boolean;
}

export const IdentityConfiguration: React.FC<IdentityConfigurationProps> = ({
  config,
  onConfigChange,
  isLoading,
  disabled
}) => {
  const [activeTab, setActiveTab] = useState<'pose' | 'attire' | 'logo'>('pose');

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100 shadow-lg'}`}>
      {/* Tabs Header */}
      <div className="flex border-b border-slate-700">
        <button 
            onClick={() => setActiveTab('pose')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'pose' ? 'border-indigo-500 text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
            Pose
        </button>
        <button 
            onClick={() => setActiveTab('attire')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'attire' ? 'border-purple-500 text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
            Attire
        </button>
        <button 
            onClick={() => setActiveTab('logo')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'logo' ? 'border-pink-500 text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
            Logo
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 bg-slate-900/30 min-h-[400px]">
         {activeTab === 'pose' && (
            <div className="animate-fade-in">
                 <PoseSelector
                    selectedCategory={config.pose.category}
                    selectedVariant={config.pose.variant}
                    onPoseChange={(category, variant) => onConfigChange({ pose: { category, variant } })}
                    disabled={isLoading || disabled}
                 />
            </div>
         )}

         {activeTab === 'attire' && (
            <div className="animate-fade-in">
                <AttireSelector
                    selected={config.attire}
                    onAttireChange={(attire) => onConfigChange({ attire })}
                    disabled={isLoading || disabled}
                />
            </div>
         )}

         {activeTab === 'logo' && (
            <div className="animate-fade-in space-y-4">
                <div className="p-4 bg-pink-900/10 border border-pink-500/20 rounded-lg">
                    <h4 className="text-sm font-medium text-pink-300 mb-2">Company Branding Asset</h4>
                    <p className="text-xs text-slate-400 mb-4">Upload a high-resolution transparent PNG of your company logo. The AI will physically integrate it into the clothing material (e.g., embroidery, metal pin).</p>
                    
                    <ImageUpload 
                      onFileSelect={(file) => onConfigChange({ logoFile: file })}
                      isLoading={isLoading}
                      hasFile={!!config.logoFile}
                      variant="compact"
                      label={config.logoFile ? "Replace Logo Asset" : "Click to Upload Logo"}
                    />
                </div>
                
                {config.logoFile && (
                    <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg animate-fade-in">
                        <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden border border-slate-700 relative">
                             {/* Transparency grid background */}
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9Im5vbmUiPjxwYXRoIGZpbGw9IiMzMzMiIGQ9Ik0wIDBoNHY0SDBWMHptNCA0aDR2NEg0VjR6Ii8+PC9zdmc+')] opacity-20"></div>
                            <img 
                                src={URL.createObjectURL(config.logoFile)} 
                                alt="Logo preview" 
                                className="w-full h-full object-contain relative z-10"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{config.logoFile.name}</div>
                            <div className="text-xs text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Asset Ready
                            </div>
                        </div>
                        <button 
                            onClick={() => onConfigChange({ logoFile: null })} 
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                            title="Remove logo"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                
                {!config.logoFile && (
                    <div className="text-xs text-slate-500 text-center mt-2 flex items-center justify-center gap-2">
                        <span>ℹ️</span>
                        <span>No logo provided. Standard unbranded attire will be generated.</span>
                    </div>
                )}
            </div>
         )}
      </div>
      
      {/* Disabled Overlay */}
      {disabled && (
        <div className="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center transition-all">
            <div className="bg-slate-900 border border-slate-600 px-5 py-3 rounded-xl text-sm text-slate-300 shadow-2xl flex items-center gap-3 transform translate-y-0">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <div className="font-semibold text-white">Source Asset Required</div>
                    <div className="text-xs text-slate-400">Upload a reference photo to begin configuration</div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};