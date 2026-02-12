import { DEFAULT_CONFIG } from './constants.js';
import { normalizeUrl, shouldExcludeUrl } from './url-utils.js';
import type { HistoryVisit, BrowsingSession } from './types.js';

/**
 * Segment a list of history visits into browsing sessions.
 *
 * A session is a contiguous block of browsing activity. A new session starts
 * when the gap between consecutive visits exceeds `gapMs`.
 *
 * @param visits - History visits sorted by visitTime ascending
 * @param gapMs - Maximum gap between visits within a session (default: 30 min)
 * @returns Array of browsing sessions
 */
export const segmentSessions = (
  visits: HistoryVisit[],
  gapMs: number = DEFAULT_CONFIG.sessionGapMs,
): BrowsingSession[] => {
  if (visits.length === 0) return [];

  // Filter and sort
  const filtered = visits.filter(v => v.url && !shouldExcludeUrl(v.url)).sort((a, b) => a.visitTime - b.visitTime);

  if (filtered.length === 0) return [];

  const sessions: BrowsingSession[] = [];
  let currentSession: BrowsingSession = {
    id: 0,
    urls: new Set(),
    titles: new Map(),
    startTime: filtered[0].visitTime,
    endTime: filtered[0].visitTime,
  };

  for (const visit of filtered) {
    if (visit.visitTime - currentSession.endTime > gapMs) {
      // Only add sessions with at least 2 unique URLs (single-URL sessions can't produce co-occurrences)
      if (currentSession.urls.size >= 2) {
        sessions.push(currentSession);
      }
      currentSession = {
        id: sessions.length,
        urls: new Set(),
        titles: new Map(),
        startTime: visit.visitTime,
        endTime: visit.visitTime,
      };
    }

    const normalized = normalizeUrl(visit.url);
    currentSession.urls.add(normalized);
    if (visit.title) {
      currentSession.titles.set(normalized, visit.title);
    }
    currentSession.endTime = visit.visitTime;
  }

  // Don't forget the last session
  if (currentSession.urls.size >= 2) {
    sessions.push(currentSession);
  }

  return sessions;
};
