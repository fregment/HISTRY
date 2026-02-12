import { initializeIndexer, getIsIndexing } from './history-indexer.js';
import { getCoOccurrencesForUrl, getMetadata, getIndexedUrlCount } from './indexeddb.js';
import { getSuggestions, normalizeUrl } from '@extension/histry-core';
import { histrySettingsStorage } from '@extension/storage';
import type { Suggestion, IndexStatus } from '@extension/histry-core';

// Simple LRU-style suggestion cache
const suggestionCache = new Map<string, { suggestions: Suggestion[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50;

const handleGetIndexStatus = async (): Promise<IndexStatus> => {
  const metadata = await getMetadata();
  const totalUrls = await getIndexedUrlCount();

  return {
    totalUrlsIndexed: totalUrls,
    totalSessionsProcessed: metadata?.totalSessionsProcessed ?? 0,
    lastIndexedTimestamp: metadata?.lastIndexedTimestamp ?? 0,
    isIndexing: getIsIndexing(),
  };
};

const invalidateCache = (): void => {
  suggestionCache.clear();
};

/**
 * Get suggestions for a given URL, using cache when available.
 */
const handleGetSuggestions = async (url: string): Promise<{ suggestions: Suggestion[] }> => {
  const normalized = normalizeUrl(url);

  // Check cache
  const cached = suggestionCache.get(normalized);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { suggestions: cached.suggestions };
  }

  const settings = await histrySettingsStorage.get();
  if (!settings.enabled) {
    return { suggestions: [] };
  }

  const entries = await getCoOccurrencesForUrl(normalized);

  const suggestions = getSuggestions(normalized, entries, {
    weights: settings.scoringWeights,
    maxResults: settings.maxSuggestions,
    blockedUrls: new Set(settings.blockedUrls),
    blockedDomains: new Set(settings.blockedDomains),
    likedUrls: new Set(settings.likedUrls),
  });

  // Update cache
  if (suggestionCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const oldestKey = suggestionCache.keys().next().value;
    if (oldestKey) suggestionCache.delete(oldestKey);
  }
  suggestionCache.set(normalized, { suggestions, timestamp: Date.now() });

  return { suggestions };
};

/**
 * Set up the message handler for communication with content scripts and popup.
 */
const setupMessageHandler = (): void => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message?.type) return false;

    switch (message.type) {
      case 'GET_SUGGESTIONS':
        handleGetSuggestions(message.payload.url).then(sendResponse);
        return true;

      case 'LIKE_URL':
        histrySettingsStorage.addLikedUrl(message.payload.url).then(() => {
          invalidateCache();
          sendResponse({ success: true });
        });
        return true;

      case 'UNLIKE_URL':
        histrySettingsStorage.removeLikedUrl(message.payload.url).then(() => {
          invalidateCache();
          sendResponse({ success: true });
        });
        return true;

      case 'BLOCK_URL':
        histrySettingsStorage.addBlockedUrl(message.payload.url).then(() => {
          invalidateCache();
          sendResponse({ success: true });
        });
        return true;

      case 'UNBLOCK_URL':
        histrySettingsStorage.removeBlockedUrl(message.payload.url).then(() => {
          invalidateCache();
          sendResponse({ success: true });
        });
        return true;

      case 'GET_INDEX_STATUS':
        handleGetIndexStatus().then(sendResponse);
        return true;

      case 'REBUILD_INDEX':
        initializeIndexer({ fullRebuild: true }).then(() => {
          invalidateCache();
          sendResponse({ success: true });
        });
        return true;

      default:
        return false;
    }
  });
};

export { setupMessageHandler, handleGetSuggestions };
