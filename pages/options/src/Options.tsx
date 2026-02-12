import '@src/Options.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { histrySettingsStorage, histryBarVisibilityStorage } from '@extension/storage';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { useState } from 'react';

const Options = () => {
  const settings = useStorage(histrySettingsStorage);
  const barVisible = useStorage(histryBarVisibilityStorage);
  const [newDomain, setNewDomain] = useState('');
  const [newBlockedUrl, setNewBlockedUrl] = useState('');

  const handleAddDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    if (domain) {
      histrySettingsStorage.addBlockedDomain(domain);
      setNewDomain('');
    }
  };

  const handleAddBlockedUrl = () => {
    const url = newBlockedUrl.trim();
    if (url) {
      histrySettingsStorage.addBlockedUrl(url);
      setNewBlockedUrl('');
    }
  };

  return (
    <div className="mx-auto max-w-2xl bg-white p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">HISTRY Settings</h1>
      <p className="mb-6 text-sm text-gray-500">
        Configure how HISTRY suggests related pages from your browsing history.
      </p>

      {/* General Settings */}
      <section className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">General</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-700">Enable HISTRY</div>
              <div className="text-xs text-gray-400">Show related page suggestions</div>
            </div>
            <button
              onClick={() => histrySettingsStorage.set(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative h-5 w-9 rounded-full transition-colors ${settings.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.enabled ? 'translate-x-4' : ''}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-700">Show suggestion bar</div>
              <div className="text-xs text-gray-400">Toggle the bar on all pages</div>
            </div>
            <button
              onClick={() => histryBarVisibilityStorage.toggle()}
              className={`relative h-5 w-9 rounded-full transition-colors ${barVisible ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${barVisible ? 'translate-x-4' : ''}`}
              />
            </button>
          </div>

          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Session gap (minutes)</span>
            <input
              type="number"
              min={5}
              max={120}
              value={settings.sessionGapMinutes}
              onChange={e =>
                histrySettingsStorage.set(prev => ({
                  ...prev,
                  sessionGapMinutes: Math.max(5, Math.min(120, Number(e.target.value))),
                }))
              }
              className="w-20 rounded border border-gray-200 px-2 py-1 text-sm text-gray-700"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Max suggestions</span>
            <input
              type="number"
              min={3}
              max={30}
              value={settings.maxSuggestions}
              onChange={e =>
                histrySettingsStorage.set(prev => ({
                  ...prev,
                  maxSuggestions: Math.max(3, Math.min(30, Number(e.target.value))),
                }))
              }
              className="w-20 rounded border border-gray-200 px-2 py-1 text-sm text-gray-700"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">History lookback (days)</span>
            <input
              type="number"
              min={7}
              max={365}
              value={settings.maxHistoryDays}
              onChange={e =>
                histrySettingsStorage.set(prev => ({
                  ...prev,
                  maxHistoryDays: Math.max(7, Math.min(365, Number(e.target.value))),
                }))
              }
              className="w-20 rounded border border-gray-200 px-2 py-1 text-sm text-gray-700"
            />
          </label>
        </div>
      </section>

      {/* Scoring Weights */}
      <section className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Scoring Weights</h2>
        <p className="mb-3 text-xs text-gray-400">Adjust how different signals influence suggestion ranking.</p>

        <div className="space-y-3">
          {[
            ['coOccurrence', 'Co-occurrence frequency'] as const,
            ['recency', 'Recency'] as const,
            ['visitFrequency', 'Visit frequency'] as const,
            ['userAffinity', 'User affinity (likes)'] as const,
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <label className="w-48 text-sm text-gray-700">{label}</label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.scoringWeights[key] * 100)}
                onChange={e =>
                  histrySettingsStorage.set(prev => ({
                    ...prev,
                    scoringWeights: {
                      ...prev.scoringWeights,
                      [key]: Number(e.target.value) / 100,
                    },
                  }))
                }
                className="flex-1"
              />
              <span className="w-10 text-right text-xs text-gray-500">
                {Math.round(settings.scoringWeights[key] * 100)}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Blocked Domains */}
      <section className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Blocked Domains</h2>
        <p className="mb-2 text-xs text-gray-400">Pages from these domains will never appear as suggestions.</p>

        <div className="mb-2 flex gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
            placeholder="e.g. example.com"
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
          />
          <button
            onClick={handleAddDomain}
            className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200">
            Add
          </button>
        </div>

        {settings.blockedDomains.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {settings.blockedDomains.map(domain => (
              <span
                key={domain}
                className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
                {domain}
                <button
                  onClick={() => histrySettingsStorage.removeBlockedDomain(domain)}
                  className="text-red-400 hover:text-red-600">
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Blocked URLs */}
      <section className="mb-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Blocked URLs</h2>
        <p className="mb-2 text-xs text-gray-400">Specific URLs that will never appear as suggestions.</p>

        <div className="mb-2 flex gap-2">
          <input
            type="text"
            value={newBlockedUrl}
            onChange={e => setNewBlockedUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddBlockedUrl()}
            placeholder="https://..."
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
          />
          <button
            onClick={handleAddBlockedUrl}
            className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200">
            Add
          </button>
        </div>

        {settings.blockedUrls.length > 0 && (
          <div className="space-y-1">
            {settings.blockedUrls.map(url => (
              <div
                key={url}
                className="flex items-center justify-between rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                <span className="max-w-[400px] truncate">{url}</span>
                <button
                  onClick={() => histrySettingsStorage.removeBlockedUrl(url)}
                  className="ml-2 text-red-400 hover:text-red-600">
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Liked/Pinned URLs */}
      {settings.likedUrls.length > 0 && (
        <section className="mb-6 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Pinned URLs</h2>
          <p className="mb-2 text-xs text-gray-400">URLs you've pinned get a ranking boost in suggestions.</p>

          <div className="space-y-1">
            {settings.likedUrls.map(url => (
              <div
                key={url}
                className="flex items-center justify-between rounded bg-green-50 px-2 py-1 text-xs text-green-700">
                <span className="max-w-[400px] truncate">{url}</span>
                <button
                  onClick={() => histrySettingsStorage.removeLikedUrl(url)}
                  className="ml-2 text-green-400 hover:text-green-600">
                  Unpin
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Index Management */}
      <section className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Index Management</h2>
        <p className="mb-3 text-xs text-gray-400">
          Rebuild the suggestion index from your browser history. This runs automatically but you can trigger it
          manually here.
        </p>
        <button
          onClick={() => chrome.runtime.sendMessage({ type: 'REBUILD_INDEX' })}
          className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100">
          Rebuild Index
        </button>
      </section>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
