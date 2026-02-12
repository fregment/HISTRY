import { useState, useEffect } from 'react';
import type { Suggestion, HistryMessage } from '@extension/histry-core';

export const useSuggestions = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUrl = window.location.href;

    // Request suggestions for current URL
    chrome.runtime.sendMessage({ type: 'GET_SUGGESTIONS', payload: { url: currentUrl } }, response => {
      if (chrome.runtime.lastError) {
        console.log('[HISTRY] Could not get suggestions:', chrome.runtime.lastError.message);
        setIsLoading(false);
        return;
      }
      if (response?.suggestions) {
        setSuggestions(response.suggestions);
      }
      setIsLoading(false);
    });

    // Listen for push updates from the background (on tab switch, navigation)
    const listener = (message: HistryMessage) => {
      if (message.type === 'SUGGESTIONS_RESULT') {
        setSuggestions(message.payload.suggestions);
        setIsLoading(false);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return { suggestions, isLoading };
};
