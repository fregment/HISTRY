import type { HistryConfig, ScoringWeights } from './types.js';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  coOccurrence: 0.5,
  recency: 0.3,
  visitFrequency: 0.1,
  userAffinity: 0.1,
};

export const DEFAULT_CONFIG: HistryConfig = {
  sessionGapMs: 30 * 60 * 1000, // 30 minutes
  maxSuggestions: 10,
  maxHistoryDays: 90,
  weights: DEFAULT_SCORING_WEIGHTS,
};

export const RECENCY_DECAY_DAYS = 30;

export const INDEX_UPDATE_ALARM_NAME = 'histry-index-update';
export const INDEX_UPDATE_INTERVAL_MINUTES = 15;

export const INDEXEDDB_NAME = 'histry-db';
export const INDEXEDDB_VERSION = 1;
export const CO_OCCURRENCE_STORE = 'co-occurrence';
export const METADATA_STORE = 'metadata';
export const TITLES_STORE = 'titles';
