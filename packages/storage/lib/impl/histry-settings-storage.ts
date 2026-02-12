import { createStorage, StorageEnum } from '../base/index.js';

interface HistrySettings {
  enabled: boolean;
  sessionGapMinutes: number;
  maxSuggestions: number;
  maxHistoryDays: number;
  blockedDomains: string[];
  blockedUrls: string[];
  likedUrls: string[];
  scoringWeights: {
    coOccurrence: number;
    recency: number;
    visitFrequency: number;
    userAffinity: number;
  };
}

const defaultSettings: HistrySettings = {
  enabled: true,
  sessionGapMinutes: 30,
  maxSuggestions: 10,
  maxHistoryDays: 90,
  blockedDomains: [],
  blockedUrls: [],
  likedUrls: [],
  scoringWeights: {
    coOccurrence: 0.5,
    recency: 0.3,
    visitFrequency: 0.1,
    userAffinity: 0.1,
  },
};

const storage = createStorage<HistrySettings>('histry-settings', defaultSettings, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export type { HistrySettings };

export const histrySettingsStorage = {
  ...storage,
  addBlockedDomain: async (domain: string) => {
    await storage.set(prev => ({
      ...prev,
      blockedDomains: [...new Set([...prev.blockedDomains, domain])],
    }));
  },
  removeBlockedDomain: async (domain: string) => {
    await storage.set(prev => ({
      ...prev,
      blockedDomains: prev.blockedDomains.filter(d => d !== domain),
    }));
  },
  addBlockedUrl: async (url: string) => {
    await storage.set(prev => ({
      ...prev,
      blockedUrls: [...new Set([...prev.blockedUrls, url])],
    }));
  },
  removeBlockedUrl: async (url: string) => {
    await storage.set(prev => ({
      ...prev,
      blockedUrls: prev.blockedUrls.filter(u => u !== url),
    }));
  },
  addLikedUrl: async (url: string) => {
    await storage.set(prev => ({
      ...prev,
      likedUrls: [...new Set([...prev.likedUrls, url])],
    }));
  },
  removeLikedUrl: async (url: string) => {
    await storage.set(prev => ({
      ...prev,
      likedUrls: prev.likedUrls.filter(u => u !== url),
    }));
  },
};
