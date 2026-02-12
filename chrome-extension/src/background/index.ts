import 'webextension-polyfill';
import { initializeIndexer } from './history-indexer.js';
import { setupIncrementalUpdater } from './incremental-updater.js';
import { setupMessageHandler } from './suggestion-handler.js';
import { setupTabListeners } from './tab-listener.js';

console.log('[HISTRY] Background service worker loaded');

// First install: build full index
chrome.runtime.onInstalled.addListener(async details => {
  if (details.reason === 'install') {
    console.log('[HISTRY] First install — starting full index build');
    await initializeIndexer({ fullRebuild: true });
  } else if (details.reason === 'update') {
    console.log('[HISTRY] Extension updated — running incremental update');
    await initializeIndexer({ fullRebuild: false });
  }
});

// Browser startup: incremental update
chrome.runtime.onStartup.addListener(async () => {
  console.log('[HISTRY] Browser startup — running incremental update');
  await initializeIndexer({ fullRebuild: false });
});

// Set up event listeners
setupTabListeners();
setupMessageHandler();
setupIncrementalUpdater();
