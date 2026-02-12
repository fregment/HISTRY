import { initializeIndexer } from './history-indexer.js';
import { INDEX_UPDATE_ALARM_NAME, INDEX_UPDATE_INTERVAL_MINUTES } from '@extension/histry-core';

/**
 * Set up periodic incremental index updates using chrome.alarms.
 * Runs every 15 minutes to index new history visits.
 */
export const setupIncrementalUpdater = (): void => {
  // Create the alarm
  chrome.alarms.create(INDEX_UPDATE_ALARM_NAME, {
    periodInMinutes: INDEX_UPDATE_INTERVAL_MINUTES,
  });

  // Handle alarm fire
  chrome.alarms.onAlarm.addListener(async alarm => {
    if (alarm.name === INDEX_UPDATE_ALARM_NAME) {
      console.log('[HISTRY] Alarm fired: running incremental update');
      await initializeIndexer({ fullRebuild: false });
    }
  });
};
