import { useStorage } from '@extension/shared';
import { histryBarVisibilityStorage } from '@extension/storage';

export const useBarVisibility = () => {
  const isVisible = useStorage(histryBarVisibilityStorage);

  return {
    isVisible,
    toggle: () => histryBarVisibilityStorage.toggle(),
  };
};
