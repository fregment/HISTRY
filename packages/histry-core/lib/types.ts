export interface HistoryVisit {
  url: string;
  title: string;
  visitTime: number;
}

export interface BrowsingSession {
  id: number;
  urls: Set<string>;
  titles: Map<string, string>;
  startTime: number;
  endTime: number;
}

export interface CoOccurrenceEntry {
  url: string;
  title: string;
  coCount: number;
  totalVisits: number;
  lastSeenTime: number;
}

export interface SerializedCoOccurrenceRecord {
  url: string;
  entries: CoOccurrenceEntry[];
}

export interface Suggestion {
  url: string;
  title: string;
  matchCount: number;
  score: number;
  faviconUrl: string;
}

export interface ScoringWeights {
  coOccurrence: number;
  recency: number;
  visitFrequency: number;
  userAffinity: number;
}

export interface HistryConfig {
  sessionGapMs: number;
  maxSuggestions: number;
  maxHistoryDays: number;
  weights: ScoringWeights;
}

export interface UserPreferences {
  enabled: boolean;
  barVisible: boolean;
  likedUrls: Set<string>;
  blockedUrls: Set<string>;
  blockedDomains: Set<string>;
  config: HistryConfig;
}

export interface IndexStatus {
  totalUrlsIndexed: number;
  totalSessionsProcessed: number;
  lastIndexedTimestamp: number;
  isIndexing: boolean;
}

export interface IndexMetadata {
  lastIndexedTimestamp: number;
  totalSessionsProcessed: number;
  totalUrlsIndexed: number;
  lastSessionUrls: string[];
}

export type HistryMessage =
  | { type: 'GET_SUGGESTIONS'; payload: { url: string } }
  | { type: 'SUGGESTIONS_RESULT'; payload: { suggestions: Suggestion[] } }
  | { type: 'LIKE_URL'; payload: { url: string } }
  | { type: 'UNLIKE_URL'; payload: { url: string } }
  | { type: 'BLOCK_URL'; payload: { url: string } }
  | { type: 'UNBLOCK_URL'; payload: { url: string } }
  | { type: 'TOGGLE_BAR'; payload: { visible: boolean } }
  | { type: 'GET_INDEX_STATUS' }
  | { type: 'INDEX_STATUS'; payload: IndexStatus }
  | { type: 'REBUILD_INDEX' };
