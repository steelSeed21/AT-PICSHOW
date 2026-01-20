import { useState, useRef, useCallback } from 'react';
import { analyzeImage, generateEmployeeImage, enhanceImage, editImage, EnhancementType } from '../services/geminiService';
import { ProcessingState, WorkflowState, AttireType, PoseCategory, PoseVariant } from '../types';

export const useImageProcessing = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    workflowState: WorkflowState.EMPTY,
    activeOperation: null
  });
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  // Guard to prevent race conditions (ignoring results from cancelled/stale requests)
  const activeRequestId = useRef<string | null>(null);

  const startRequest = (operation: ProcessingState['activeOperation']) => {
    const requestId = crypto.randomUUID();
    activeRequestId.current = requestId;
    setProcessingState({
      workflowState: WorkflowState.PROCESSING,
      activeOperation: operation
    });
    setError(null);
    setIsApiKeyMissing(false);
    return requestId;
  };

  const endRequest = (requestId: string, success: boolean) => {
    if (activeRequestId.current === requestId) {
      setProcessingState(prev => ({
        workflowState: success ? WorkflowState.RESULT_READY : WorkflowState.ERROR,
        activeOperation: null
      }));
      activeRequestId.current = null;
      return true; // Still active
    }
    return false; // Stale request
  };

  const handleError = (err: unknown, requestId: string) => {
      if (endRequest(requestId, false)) {
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
    context: 'TRAVEL_MARKETING' | 'IDENTITY_STANDARDIZATION'
  ) => {
    const requestId = startRequest('ANALYZING');
    try {
      const result = await analyzeImage(file, context);
      if (!endRequest(requestId, true)) return null;
      // After analysis, we are effectively back to SOURCE_READY if no enhancement is applied yet,
      // OR RESULT_READY if we want to show the analysis. 
      // For this workflow, analysis implies we are ready to generate.
      setProcessingState(prev => ({ ...prev, workflowState: WorkflowState.SOURCE_READY })); 
      return result;
    } catch (err) {
      handleError(err, requestId);
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
    const requestId = startRequest('GENERATING');
    try {
      const base64 = await generateEmployeeImage(prompt, logoFile, referenceImage, attire, pose);
      if (!endRequest(requestId, true)) return null;
      return base64;
    } catch (err) {
      handleError(err, requestId);
      return null;
    }
  }, []);

  // 3. ENHANCEMENT
  const processEnhancement = useCallback(async (
    file: File,
    presetId: string
  ) => {
    const requestId = startRequest('ENHANCING');
    try {
      // Cast presetId safely, assuming the caller passes valid IDs
      const base64 = await enhanceImage(file, presetId as EnhancementType);
      if (!endRequest(requestId, true)) return null;
      return base64;
    } catch (err) {
      handleError(err, requestId);
      return null;
    }
  }, []);

  // 4. EDITING
  const processEdit = useCallback(async (
    file: File,
    prompt: string
  ) => {
    const requestId = startRequest('EDITING');
    try {
      const base64 = await editImage(file, prompt);
      if (!endRequest(requestId, true)) return null;
      return base64;
    } catch (err) {
      handleError(err, requestId);
      return null;
    }
  }, []);

  // Generic Clear Error
  const clearError = () => {
      setError(null);
      setIsApiKeyMissing(false);
      // Reset to empty if we were in error state, or keep current if valid
      setProcessingState(prev => ({
          ...prev,
          workflowState: prev.workflowState === WorkflowState.ERROR ? WorkflowState.EMPTY : prev.workflowState
      }));
  };
  
  const isBusy = processingState.workflowState === WorkflowState.PROCESSING;

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