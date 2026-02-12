import {
  INDEXEDDB_NAME,
  INDEXEDDB_VERSION,
  CO_OCCURRENCE_STORE,
  METADATA_STORE,
  TITLES_STORE,
} from '@extension/histry-core';
import type { CoOccurrenceEntry, IndexMetadata, SerializedCoOccurrenceRecord } from '@extension/histry-core';

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CO_OCCURRENCE_STORE)) {
        db.createObjectStore(CO_OCCURRENCE_STORE, { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(TITLES_STORE)) {
        db.createObjectStore(TITLES_STORE, { keyPath: 'url' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
};

export const getCoOccurrencesForUrl = async (url: string): Promise<CoOccurrenceEntry[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CO_OCCURRENCE_STORE, 'readonly');
    const store = tx.objectStore(CO_OCCURRENCE_STORE);
    const request = store.get(url);
    request.onsuccess = () => {
      const record = request.result as SerializedCoOccurrenceRecord | undefined;
      resolve(record?.entries ?? []);
    };
    request.onerror = () => reject(request.error);
  });
};

export const storeCoOccurrencesForUrl = async (url: string, entries: CoOccurrenceEntry[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CO_OCCURRENCE_STORE, 'readwrite');
    const store = tx.objectStore(CO_OCCURRENCE_STORE);
    const record: SerializedCoOccurrenceRecord = { url, entries };
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const storeFullIndex = async (index: Map<string, Map<string, CoOccurrenceEntry>>): Promise<void> => {
  const db = await openDB();
  const entries = Array.from(index.entries());
  const BATCH_SIZE = 200;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CO_OCCURRENCE_STORE, 'readwrite');
      const store = tx.objectStore(CO_OCCURRENCE_STORE);

      for (const [url, coEntries] of batch) {
        const record: SerializedCoOccurrenceRecord = {
          url,
          entries: Array.from(coEntries.values()),
        };
        store.put(record);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};

export const getMetadata = async (): Promise<IndexMetadata | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(METADATA_STORE, 'readonly');
    const store = tx.objectStore(METADATA_STORE);
    const request = store.get('index-metadata');
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error);
  });
};

export const setMetadata = async (metadata: IndexMetadata): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(METADATA_STORE, 'readwrite');
    const store = tx.objectStore(METADATA_STORE);
    const request = store.put({ key: 'index-metadata', value: metadata });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getIndexedUrlCount = async (): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CO_OCCURRENCE_STORE, 'readonly');
    const store = tx.objectStore(CO_OCCURRENCE_STORE);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const clearAllData = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([CO_OCCURRENCE_STORE, METADATA_STORE, TITLES_STORE], 'readwrite');
    tx.objectStore(CO_OCCURRENCE_STORE).clear();
    tx.objectStore(METADATA_STORE).clear();
    tx.objectStore(TITLES_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const mergeCoOccurrencesForUrl = async (url: string, newEntries: CoOccurrenceEntry[]): Promise<void> => {
  const existing = await getCoOccurrencesForUrl(url);
  const merged = new Map<string, CoOccurrenceEntry>();

  for (const entry of existing) {
    merged.set(entry.url, { ...entry });
  }

  for (const entry of newEntries) {
    const prev = merged.get(entry.url);
    if (prev) {
      prev.coCount += entry.coCount;
      prev.totalVisits += entry.totalVisits;
      prev.lastSeenTime = Math.max(prev.lastSeenTime, entry.lastSeenTime);
      if (entry.title !== entry.url) {
        prev.title = entry.title;
      }
    } else {
      merged.set(entry.url, { ...entry });
    }
  }

  await storeCoOccurrencesForUrl(url, Array.from(merged.values()));
};
