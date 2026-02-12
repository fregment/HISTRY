import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { histrySettingsStorage, histryBarVisibilityStorage } from '@extension/storage';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { useEffect, useState } from 'react';
import type { IndexStatus } from '@extension/histry-core';

const formatRelativeTime = (timestamp: number): string => {
  if (!timestamp) return 'Never';
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const Popup = () => {
  const settings = useStorage(histrySettingsStorage);
  const barVisible = useStorage(histryBarVisibilityStorage);
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_INDEX_STATUS' }, response => {
      if (chrome.runtime.lastError) return;
      if (response) setIndexStatus(response);
    });
  }, []);

  const handleRebuild = () => {
    setIndexStatus(prev => (prev ? { ...prev, isIndexing: true } : null));
    chrome.runtime.sendMessage({ type: 'REBUILD_INDEX' }, () => {
      chrome.runtime.sendMessage({ type: 'GET_INDEX_STATUS' }, response => {
        if (response) setIndexStatus(response);
      });
    });
  };

  return (
    <div className="w-72 bg-white p-4">
      <div className="mb-3">
        <h1 className="text-lg font-bold text-gray-900">HISTRY</h1>
        <p className="text-xs text-gray-500">Related pages from your browsing history</p>
      </div>

      {/* Enable/Disable */}
      <div className="mb-2 flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
        <span className="text-sm text-gray-700">Enabled</span>
        <button
          onClick={() => histrySettingsStorage.set(prev => ({ ...prev, enabled: !prev.enabled }))}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            settings.enabled ? 'bg-emerald-500' : 'bg-gray-300'
          }`}>
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              settings.enabled ? 'translate-x-4' : ''
            }`}
          />
        </button>
      </div>

      {/* Bar Visibility */}
      <div className="mb-3 flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
        <span className="text-sm text-gray-700">Show suggestion bar</span>
        <button
          onClick={() => histryBarVisibilityStorage.toggle()}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            barVisible ? 'bg-emerald-500' : 'bg-gray-300'
          }`}>
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              barVisible ? 'translate-x-4' : ''
            }`}
          />
        </button>
      </div>

      {/* Index Status */}
      {indexStatus && (
        <div className="mb-3 rounded-md bg-gray-50 p-3">
          <h2 className="mb-1 text-xs font-semibold text-gray-600">Index Status</h2>
          <div className="space-y-0.5 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>URLs indexed</span>
              <span className="font-medium text-gray-700">{indexStatus.totalUrlsIndexed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Sessions</span>
              <span className="font-medium text-gray-700">{indexStatus.totalSessionsProcessed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Last updated</span>
              <span className="font-medium text-gray-700">{formatRelativeTime(indexStatus.lastIndexedTimestamp)}</span>
            </div>
          </div>
          {indexStatus.isIndexing && (
            <div className="mt-2 text-xs font-medium text-blue-500">Indexing in progress...</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleRebuild}
          disabled={indexStatus?.isIndexing}
          className="flex-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50">
          Rebuild Index
        </button>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="flex-1 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
          Settings
        </button>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
