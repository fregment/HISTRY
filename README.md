# HISTRY

A Chrome extension that suggests related pages from your browsing history based on the currently active tab. A bookmark-bar-like strip appears at the top of every page with links you've visited in similar browsing contexts.

## How It Works

HISTRY analyzes your local browser history to find pages that were frequently visited together in the same browsing session. When you navigate to a page, it shows the most relevant related pages as clickable suggestions.

### Algorithm

1. **Session segmentation** — History visits are grouped into browsing sessions using a 30-minute idle gap heuristic
2. **Co-occurrence indexing** — For each session, every pair of URLs visited together gets a co-occurrence count, stored as an inverted index in IndexedDB
3. **Multi-signal ranking** — Suggestions are scored using four signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| Co-occurrence frequency | 0.50 | How often pages were visited in the same session |
| Recency decay | 0.30 | Exponential decay (~21-day half-life) favoring recent visits |
| Visit frequency | 0.10 | Boost for frequently visited pages |
| User affinity | 0.10 | Boost for pages the user has pinned |

4. **Incremental updates** — The index rebuilds incrementally every 15 minutes via `chrome.alarms`, so new browsing activity is reflected without full rebuilds

### Privacy

All data stays local. HISTRY uses `chrome.history` to read your visits and stores the co-occurrence index in IndexedDB within the extension's storage. Nothing is sent to any server.

## Installation

### Prerequisites

- Node.js >= 22.15.1
- pnpm (`npm install -g pnpm`)

### Development

```bash
pnpm install
pnpm dev
```

Then load the extension in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist` directory

### Production Build

```bash
pnpm build
```

### Firefox

```bash
pnpm dev:firefox    # development
pnpm build:firefox  # production
```

Load via `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → select `dist/manifest.json`.

## Project Structure

```
chrome-extension/
├── manifest.ts              # Extension manifest (permissions, content scripts)
├── src/background/          # Service worker
│   ├── index.ts             # Entry point — wires up all modules
│   ├── indexeddb.ts          # Promise-based IndexedDB wrapper
│   ├── history-indexer.ts    # Fetches chrome.history, builds co-occurrence index
│   ├── suggestion-handler.ts # Message handler (GET_SUGGESTIONS, LIKE/BLOCK, etc.)
│   ├── tab-listener.ts       # Proactive suggestions on tab switch/navigation
│   └── incremental-updater.ts# 15-min alarm for index updates
└── public/                  # Icons, content CSS

pages/
├── content-ui/              # Suggestion bar injected into pages (Shadow DOM)
│   └── src/matches/all/
│       ├── App.tsx           # Main bar composition
│       ├── components/       # BarContainer, SuggestionBar, SuggestionItem, etc.
│       └── hooks/            # useSuggestions, useBarVisibility
├── popup/                   # Toolbar popup (enable/disable, status, quick settings)
└── options/                 # Full settings page (weights, blocked domains, etc.)

packages/
├── histry-core/             # Pure algorithm logic (no browser APIs)
│   └── lib/
│       ├── types.ts          # All shared interfaces
│       ├── constants.ts      # Default config, IndexedDB constants
│       ├── url-utils.ts      # URL normalization, domain extraction
│       ├── session-segmenter.ts
│       ├── co-occurrence-index.ts
│       └── suggestion-engine.ts
├── storage/                 # chrome.storage wrappers
│   └── lib/impl/
│       ├── histry-settings-storage.ts
│       └── histry-bar-visibility-storage.ts
├── i18n/                    # Internationalization
├── ui/                      # Shared UI utilities
├── shared/                  # Shared types and hooks
└── ...                      # Build tooling (vite-config, tsconfig, hmr, env, etc.)
```

## Permissions

| Permission | Reason |
|-----------|--------|
| `history` | Read browsing history to build the co-occurrence index |
| `storage` | Persist user settings across contexts |
| `tabs` | Detect tab switches and page navigations |
| `alarms` | Schedule periodic incremental index updates |
| `favicon` | Display site favicons in the suggestion bar |

## Configuration

All settings are accessible via the extension's options page (right-click extension icon → Options):

- **Session gap** — Idle time threshold for session boundaries (default: 30 min)
- **Max suggestions** — Number of suggestions shown in the bar (default: 10)
- **History lookback** — How far back to index (default: 90 days)
- **Scoring weights** — Adjust the four ranking signal weights
- **Blocked domains/URLs** — Exclude specific sites from suggestions
- **Pinned URLs** — Boost specific pages in rankings

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/)
- [Vite 6](https://vitejs.dev/) + [Turborepo](https://turbo.build/repo)
- [Tailwind CSS 3.4](https://tailwindcss.com/)
- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- pnpm workspaces monorepo

## Acknowledgements

Built on [chrome-extension-boilerplate-react-vite](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite) by Jonghakseo.

## License

MIT
