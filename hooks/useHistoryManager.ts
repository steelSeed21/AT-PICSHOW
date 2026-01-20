import { useState, useRef, useEffect, useCallback } from 'react';
import { HistoryItem, VisualAnalysisResult } from '../types';
import { DEFAULT_TIPS } from '../constants';

export const useHistoryManager = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  // Ref to track history for cleanup without stale closures in useEffect
  const historyRef = useRef<HistoryItem[]>([]);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Helper to create IDs
  const generateId = () => crypto.randomUUID();

  // CLEANUP: Revoke ObjectURLs to prevent memory leaks
  const cleanupUrl = (url: string) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const cleanupItems = useCallback((items: HistoryItem[]) => {
    items.forEach(item => cleanupUrl(item.url));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupItems(historyRef.current);
  }, [cleanupItems]);

  const addToHistory = useCallback((file: File, url?: string) => {
    const objectUrl = url || URL.createObjectURL(file);
    
    const newItem: HistoryItem = {
      id: generateId(),
      file,
      url: objectUrl,
      analysis: null,
      tips: DEFAULT_TIPS,
      timestamp: Date.now()
    };

    setHistory(prev => {
      // If we are in the middle of history and add new item, discard future items
      // BUT we must cleanup their URLs first!
      const futureItems = prev.slice(currentIndex + 1);
      cleanupItems(futureItems);
      
      const keptHistory = prev.slice(0, currentIndex + 1);
      return [...keptHistory, newItem];
    });

    setCurrentIndex(prev => prev + 1);
    return newItem.id;
  }, [currentIndex, cleanupItems]);

  const updateHistoryItem = useCallback((id: string, updates: Partial<HistoryItem>) => {
    setHistory(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    }));
  }, []);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, history.length]);

  const resetHistory = useCallback(() => {
    cleanupItems(historyRef.current);
    setHistory([]);
    setCurrentIndex(-1);
  }, [cleanupItems]);

  // Getters
  const currentItem = currentIndex >= 0 ? history[currentIndex] : null;
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    history,
    currentIndex,
    currentItem,
    addToHistory,
    updateHistoryItem,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory
  };
};