import { storeFullIndex, getMetadata, setMetadata, clearAllData, mergeCoOccurrencesForUrl } from './indexeddb.js';
import { segmentSessions, buildCoOccurrenceIndex } from '@extension/histry-core';
import { histrySettingsStorage } from '@extension/storage';
import type { HistoryVisit, BrowsingSession, CoOccurrenceEntry } from '@extension/histry-core';

let isIndexing = false;

const getIsIndexing = (): boolean => isIndexing;

/**
 * Full index build: fetch all history within maxHistoryDays and build from scratch.
 */
const fullIndexBuild = async (sessionGapMinutes: number, maxHistoryDays: number): Promise<void> => {
  isIndexing = true;
  console.log('[HISTRY] Starting full index build...');

  try {
    await clearAllData();

    const startTime = Date.now() - maxHistoryDays * 24 * 60 * 60 * 1000;
    const visits = await fetchHistoryVisits(startTime);

    console.log(`[HISTRY] Fetched ${visits.length} history visits`);

    if (visits.length === 0) {
      await setMetadata({
        lastIndexedTimestamp: Date.now(),
        totalSessionsProcessed: 0,
        totalUrlsIndexed: 0,
        lastSessionUrls: [],
      });
      return;
    }

    const gapMs = sessionGapMinutes * 60 * 1000;
    const sessions = segmentSessions(visits, gapMs);
    console.log(`[HISTRY] Segmented into ${sessions.length} sessions`);

    const index = buildCoOccurrenceIndex(sessions);
    console.log(`[HISTRY] Built index with ${index.size} URLs`);

    await storeFullIndex(index);

    const lastSession = sessions[sessions.length - 1];
    await setMetadata({
      lastIndexedTimestamp: Date.now(),
      totalSessionsProcessed: sessions.length,
      totalUrlsIndexed: index.size,
      lastSessionUrls: lastSession ? Array.from(lastSession.urls) : [],
    });

    console.log('[HISTRY] Full index build complete');
  } catch (error) {
    console.error('[HISTRY] Full index build failed:', error);
  } finally {
    isIndexing = false;
  }
};

/**
 * Store a partial index by merging into existing IndexedDB records.
 */
const storePartialIndex = async (index: Map<string, Map<string, CoOccurrenceEntry>>): Promise<void> => {
  for (const [url, entries] of index) {
    await mergeCoOccurrencesForUrl(url, Array.from(entries.values()));
  }
};

/**
 * Incremental update: only process visits since the last indexed timestamp.
 */
const incrementalIndexUpdate = async (
  lastIndexedTimestamp: number,
  lastSessionUrls: string[],
  sessionGapMinutes: number,
): Promise<void> => {
  isIndexing = true;
  console.log('[HISTRY] Starting incremental index update...');

  try {
    const visits = await fetchHistoryVisits(lastIndexedTimestamp);

    if (visits.length === 0) {
      console.log('[HISTRY] No new visits since last index');
      return;
    }

    console.log(`[HISTRY] Found ${visits.length} new visits`);

    const gapMs = sessionGapMinutes * 60 * 1000;
    const newSessions = segmentSessions(visits, gapMs);

    if (newSessions.length === 0) {
      console.log('[HISTRY] No new sessions to process');
      return;
    }

    // Check if the first new session should merge with the last indexed session
    let sessionsToProcess = newSessions;
    if (lastSessionUrls.length > 0 && newSessions[0].startTime - lastIndexedTimestamp < gapMs) {
      // Merge with the previous tail session
      const mergedSession: BrowsingSession = {
        id: -1,
        urls: new Set([...lastSessionUrls, ...newSessions[0].urls]),
        titles: new Map(newSessions[0].titles),
        startTime: lastIndexedTimestamp,
        endTime: newSessions[0].endTime,
      };

      // Build index for just the merged session
      const mergedIndex = buildCoOccurrenceIndex([mergedSession]);
      await storePartialIndex(mergedIndex);

      sessionsToProcess = newSessions.slice(1);
    }

    // Process remaining new sessions
    if (sessionsToProcess.length > 0) {
      const partialIndex = buildCoOccurrenceIndex(sessionsToProcess);
      await storePartialIndex(partialIndex);
    }

    // Update metadata
    const metadata = await getMetadata();
    const lastSession = newSessions[newSessions.length - 1];
    await setMetadata({
      lastIndexedTimestamp: Date.now(),
      totalSessionsProcessed: (metadata?.totalSessionsProcessed ?? 0) + newSessions.length,
      totalUrlsIndexed: metadata?.totalUrlsIndexed ?? 0, // Approximate; exact count would require scanning IDB
      lastSessionUrls: lastSession ? Array.from(lastSession.urls) : [],
    });

    console.log(`[HISTRY] Incremental update complete: ${newSessions.length} new sessions`);
  } catch (error) {
    console.error('[HISTRY] Incremental update failed:', error);
  } finally {
    isIndexing = false;
  }
};

/**
 * Fetch history visits from the Chrome History API.
 * Processes in batches to avoid memory pressure.
 */
const fetchHistoryVisits = async (startTime: number): Promise<HistoryVisit[]> => {
  const historyItems = await chrome.history.search({
    text: '',
    startTime,
    maxResults: 100000,
  });

  const visits: HistoryVisit[] = [];
  const BATCH_SIZE = 500;

  for (let i = 0; i < historyItems.length; i += BATCH_SIZE) {
    const batch = historyItems.slice(i, i + BATCH_SIZE);

    for (const item of batch) {
      if (!item.url) continue;

      const itemVisits = await chrome.history.getVisits({ url: item.url });

      for (const visit of itemVisits) {
        if (visit.visitTime && visit.visitTime >= startTime) {
          visits.push({
            url: item.url,
            title: item.title || '',
            visitTime: visit.visitTime,
          });
        }
      }
    }

    // Yield to event loop between batches
    if (i + BATCH_SIZE < historyItems.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return visits;
};

/**
 * Initialize the indexer — either full rebuild or incremental update.
 */
const initializeIndexer = async (options: { fullRebuild: boolean }): Promise<void> => {
  if (isIndexing) {
    console.log('[HISTRY] Indexing already in progress, skipping');
    return;
  }

  const settings = await histrySettingsStorage.get();
  if (!settings.enabled) {
    console.log('[HISTRY] Extension disabled, skipping index');
    return;
  }

  const metadata = await getMetadata();

  if (options.fullRebuild || !metadata?.lastIndexedTimestamp) {
    await fullIndexBuild(settings.sessionGapMinutes, settings.maxHistoryDays);
  } else {
    await incrementalIndexUpdate(metadata.lastIndexedTimestamp, metadata.lastSessionUrls, settings.sessionGapMinutes);
  }
};

export { getIsIndexing, initializeIndexer };
