import { createStorage, StorageEnum } from '../base/index.js';

const storage = createStorage<boolean>('histry-bar-visible', true, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const histryBarVisibilityStorage = {
  ...storage,
  toggle: async () => {
    await storage.set(prev => !prev);
  },
};
