import { useState, useRef, useCallback } from 'react';
import { analyzeImage, generateEmployeeImage, enhanceImage, editImage, EnhancementType } from '../services/geminiService';
import { ProcessingState, AppMode, AttireType, PoseCategory, PoseVariant } from '../types';

export const useImageProcessing = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isAnalyzing: false,
    isGenerating: false,
    isEnhancing: false,
    isEditing: false
  });
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  // Guard to prevent race conditions (ignoring results from cancelled/stale requests)
  const activeRequestId = useRef<string | null>(null);

  const startRequest = (type: keyof ProcessingState) => {
    const requestId = crypto.randomUUID();
    activeRequestId.current = requestId;
    setProcessingState(prev => ({ ...prev, [type]: true }));
    setError(null);
    setIsApiKeyMissing(false);
    return requestId;
  };

  const endRequest = (type: keyof ProcessingState, requestId: string) => {
    if (activeRequestId.current === requestId) {
      setProcessingState(prev => ({ ...prev, [type]: false }));
      activeRequestId.current = null;
      return true; // Still active
    }
    return false; // Stale request
  };

  const handleError = (err: unknown, requestId: string, type: keyof ProcessingState) => {
      if (endRequest(type, requestId)) {
          const message = err instanceof Error ? err.message : "An unknown error occurred";
          if (message === "API_KEY_MISSING") {
              setIsApiKeyMissing(true);
          } else {
              setError(message);
          }
      }
  };

  // 1. ANALYSIS
  const processAnalysis = useCallback(async (
    file: File, 
    context: string
  ) => {
    const requestId = startRequest('isAnalyzing');
    try {
      const result = await analyzeImage(file, context);
      if (!endRequest('isAnalyzing', requestId)) return null;
      return result;
    } catch (err) {
      handleError(err, requestId, 'isAnalyzing');
      return null;
    }
  }, []);

  // 2. GENERATION (Identity)
  const processGeneration = useCallback(async (
    prompt: string,
    logoFile: File | null,
    referenceImage: File,
    attire: AttireType,
    pose: { category: PoseCategory; variant: PoseVariant }
  ) => {
    const requestId = startRequest('isGenerating');
    try {
      const base64 = await generateEmployeeImage(prompt, logoFile, referenceImage, attire, pose);
      if (!endRequest('isGenerating', requestId)) return null;
      return base64;
    } catch (err) {
      handleError(err, requestId, 'isGenerating');
      return null;
    }
  }, []);

  // 3. ENHANCEMENT
  const processEnhancement = useCallback(async (
    file: File,
    presetId: string
  ) => {
    const requestId = startRequest('isEnhancing');
    try {
      // Cast presetId safely, assuming the caller passes valid IDs
      const base64 = await enhanceImage(file, presetId as EnhancementType);
      if (!endRequest('isEnhancing', requestId)) return null;
      return base64;
    } catch (err) {
      handleError(err, requestId, 'isEnhancing');
      return null;
    }
  }, []);

  // 4. EDITING
  const processEdit = useCallback(async (
    file: File,
    prompt: string
  ) => {
    const requestId = startRequest('isEditing');
    try {
      const base64 = await editImage(file, prompt);
      if (!endRequest('isEditing', requestId)) return null;
      return base64;
    } catch (err) {
      handleError(err, requestId, 'isEditing');
      return null;
    }
  }, []);

  // Generic Clear Error
  const clearError = () => {
      setError(null);
      setIsApiKeyMissing(false);
  };
  
  // Aggregate loading state
  const isBusy = Object.values(processingState).some(Boolean);

  return {
    processingState,
    isBusy,
    error,
    isApiKeyMissing,
    clearError,
    processAnalysis,
    processGeneration,
    processEnhancement,
    processEdit
  };
};