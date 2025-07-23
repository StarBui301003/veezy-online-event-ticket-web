import { useState, useEffect, useCallback } from 'react';

type ChatMode = 'selection' | 'ai' | 'admin';

interface UseChatModeReturn {
  chatMode: ChatMode;
  hasEverSelected: boolean;
  setChatMode: (mode: ChatMode) => void;
  resetToSelection: () => void;
  markAsSelected: () => void;
}

const CHAT_MODE_STORAGE_KEY = 'veezy_chat_mode_selected';

export const useChatMode = (): UseChatModeReturn => {
  const [chatMode, setChatModeState] = useState<ChatMode>('selection');
  const [hasEverSelected, setHasEverSelected] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHAT_MODE_STORAGE_KEY);
      if (stored === 'true') {
        setHasEverSelected(true);
      }
    } catch (error) {
      console.warn('Failed to load chat mode selection state:', error);
    }
  }, []);

  // Set chat mode
  const setChatMode = useCallback((mode: ChatMode) => {
    setChatModeState(mode);
  }, []);

  // Reset to selection mode
  const resetToSelection = useCallback(() => {
    setChatModeState('selection');
  }, []);

  // Mark that user has made a selection (persist this choice)
  const markAsSelected = useCallback(() => {
    setHasEverSelected(true);
    try {
      localStorage.setItem(CHAT_MODE_STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('Failed to save chat mode selection state:', error);
    }
  }, []);

  return {
    chatMode,
    hasEverSelected,
    setChatMode,
    resetToSelection,
    markAsSelected
  };
};

export default useChatMode;
