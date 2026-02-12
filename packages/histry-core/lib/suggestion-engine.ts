import { DEFAULT_SCORING_WEIGHTS, RECENCY_DECAY_DAYS } from './constants.js';
import { getDomain, getFaviconUrl, normalizeUrl } from './url-utils.js';
import type { CoOccurrenceEntry, Suggestion, ScoringWeights } from './types.js';

interface ScoringOptions {
  weights?: ScoringWeights;
  maxResults?: number;
  blockedUrls?: Set<string>;
  blockedDomains?: Set<string>;
  likedUrls?: Set<string>;
}

/**
 * Rank and return top suggestions for a given URL based on co-occurrence entries.
 *
 * Uses a multi-signal scoring function:
 * 1. Co-occurrence frequency (log-scaled)
 * 2. Recency decay (exponential, ~21-day half-life)
 * 3. Visit frequency boost (log-scaled)
 * 4. User affinity boost (for liked/pinned URLs)
 *
 * @param currentUrl - The URL to get suggestions for
 * @param entries - Co-occurrence entries for this URL (from IndexedDB)
 * @param options - Scoring parameters and filters
 * @returns Ranked suggestions
 */
export const getSuggestions = (
  currentUrl: string,
  entries: CoOccurrenceEntry[],
  options: ScoringOptions = {},
): Suggestion[] => {
  const {
    weights = DEFAULT_SCORING_WEIGHTS,
    maxResults = 10,
    blockedUrls = new Set(),
    blockedDomains = new Set(),
    likedUrls = new Set(),
  } = options;

  if (entries.length === 0) return [];

  const now = Date.now();
  const currentNormalized = normalizeUrl(currentUrl);
  const currentDomain = getDomain(currentUrl);

  const scored: { entry: CoOccurrenceEntry; score: number }[] = [];

  for (const entry of entries) {
    // Skip the current URL itself
    if (entry.url === currentNormalized) continue;

    // Skip blocked URLs
    if (blockedUrls.has(entry.url)) continue;

    // Skip blocked domains
    const entryDomain = getDomain(entry.url);
    if (blockedDomains.has(entryDomain)) continue;

    // Signal 1: Co-occurrence frequency (logarithmic to prevent domination by high-frequency pairs)
    const freqScore = Math.log2(1 + entry.coCount);

    // Signal 2: Recency decay (exponential decay, ~21-day half-life)
    const daysSinceLastSeen = (now - entry.lastSeenTime) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.exp(-daysSinceLastSeen / RECENCY_DECAY_DAYS);

    // Signal 3: Visit frequency boost
    const visitBoost = Math.log2(1 + entry.totalVisits) * 0.2;

    // Signal 4: User affinity (liked/pinned URLs get a boost)
    const affinityBoost = likedUrls.has(entry.url) ? 2.0 : 0;

    // Composite score
    const score =
      freqScore * weights.coOccurrence +
      recencyScore * weights.recency +
      visitBoost * weights.visitFrequency +
      affinityBoost * weights.userAffinity;

    scored.push({ entry, score });
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Diversity: limit to at most 3 results from the same domain
  const domainCount = new Map<string, number>();
  const diverse: typeof scored = [];

  for (const item of scored) {
    const domain = getDomain(item.entry.url);
    const count = domainCount.get(domain) || 0;
    // Allow same-domain as current URL more freely since they're clearly related
    const limit = domain === currentDomain ? 5 : 3;
    if (count < limit) {
      diverse.push(item);
      domainCount.set(domain, count + 1);
    }
    if (diverse.length >= maxResults) break;
  }

  return diverse.map(({ entry, score }) => ({
    url: entry.url,
    title: entry.title,
    matchCount: entry.coCount,
    score,
    faviconUrl: getFaviconUrl(entry.url),
  }));
};
