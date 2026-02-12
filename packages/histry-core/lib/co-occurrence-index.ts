import type { BrowsingSession, CoOccurrenceEntry } from './types.js';

/**
 * In-memory representation of the co-occurrence index.
 * Maps each URL to a map of co-occurring URLs with their stats.
 */
export type CoOccurrenceIndex = Map<string, Map<string, CoOccurrenceEntry>>;

/**
 * Build a co-occurrence index from a list of browsing sessions.
 *
 * For each session, every pair of unique URLs gets a co-occurrence count.
 * This produces an inverted index where looking up any URL gives all
 * URLs that were visited in the same sessions, with frequency counts.
 *
 * @param sessions - Browsing sessions with their URL sets
 * @returns The co-occurrence index
 */
export const buildCoOccurrenceIndex = (sessions: BrowsingSession[]): CoOccurrenceIndex => {
  const index: CoOccurrenceIndex = new Map();

  for (const session of sessions) {
    updateIndexForSession(index, session);
  }

  return index;
};

/**
 * Update the index with co-occurrences from a single session.
 * Used both during full builds and incremental updates.
 */
export const updateIndexForSession = (index: CoOccurrenceIndex, session: BrowsingSession): void => {
  const urlsArray = Array.from(session.urls);

  for (let i = 0; i < urlsArray.length; i++) {
    const urlA = urlsArray[i];

    if (!index.has(urlA)) {
      index.set(urlA, new Map());
    }
    const entriesForA = index.get(urlA)!;

    for (let j = 0; j < urlsArray.length; j++) {
      if (i === j) continue;

      const urlB = urlsArray[j];
      const existing = entriesForA.get(urlB);

      if (existing) {
        existing.coCount += 1;
        existing.totalVisits += 1;
        existing.lastSeenTime = Math.max(existing.lastSeenTime, session.endTime);
        // Update title if we have a newer one
        const title = session.titles.get(urlB);
        if (title) {
          existing.title = title;
        }
      } else {
        entriesForA.set(urlB, {
          url: urlB,
          title: session.titles.get(urlB) || urlB,
          coCount: 1,
          totalVisits: 1,
          lastSeenTime: session.endTime,
        });
      }
    }
  }
};

/**
 * Merge a partial index (from new sessions) into the main index.
 * Used during incremental updates to avoid rebuilding the entire index.
 */
export const mergeIndices = (main: CoOccurrenceIndex, partial: CoOccurrenceIndex): void => {
  for (const [url, partialEntries] of partial) {
    if (!main.has(url)) {
      main.set(url, new Map());
    }
    const mainEntries = main.get(url)!;

    for (const [coUrl, partialEntry] of partialEntries) {
      const existing = mainEntries.get(coUrl);
      if (existing) {
        existing.coCount += partialEntry.coCount;
        existing.totalVisits += partialEntry.totalVisits;
        existing.lastSeenTime = Math.max(existing.lastSeenTime, partialEntry.lastSeenTime);
        if (partialEntry.title !== coUrl) {
          existing.title = partialEntry.title;
        }
      } else {
        mainEntries.set(coUrl, { ...partialEntry });
      }
    }
  }
};

/**
 * Serialize the entries for a single URL for IndexedDB storage.
 */
export const serializeEntries = (entries: Map<string, CoOccurrenceEntry>): CoOccurrenceEntry[] =>
  Array.from(entries.values());

/**
 * Deserialize entries from IndexedDB back into a Map.
 */
export const deserializeEntries = (entries: CoOccurrenceEntry[]): Map<string, CoOccurrenceEntry> => {
  const map = new Map<string, CoOccurrenceEntry>();
  for (const entry of entries) {
    map.set(entry.url, entry);
  }
  return map;
};
