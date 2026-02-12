import { handleGetSuggestions } from './suggestion-handler.js';
import { shouldExcludeUrl } from '@extension/histry-core';

/**
 * Set up tab event listeners to proactively push suggestions
 * when the user navigates or switches tabs.
 */
export const setupTabListeners = (): void => {
  // When a page finishes loading, send suggestions to the content script
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab.url) return;
    if (shouldExcludeUrl(tab.url)) return;

    try {
      const result = await handleGetSuggestions(tab.url);
      await chrome.tabs.sendMessage(tabId, {
        type: 'SUGGESTIONS_RESULT',
        payload: result,
      });
    } catch {
      // Content script may not be ready yet — it will request via message
    }
  });

  // When the user switches tabs, pre-compute suggestions for the active tab
  chrome.tabs.onActivated.addListener(async activeInfo => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (!tab.url || shouldExcludeUrl(tab.url)) return;

      const result = await handleGetSuggestions(tab.url);
      await chrome.tabs.sendMessage(activeInfo.tabId, {
        type: 'SUGGESTIONS_RESULT',
        payload: result,
      });
    } catch {
      // Tab may not have content script loaded
    }
  });
};
