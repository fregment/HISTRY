import { SuggestionItemActions } from './SuggestionItemActions';
import { useState } from 'react';
import type { Suggestion } from '@extension/histry-core';

const DEFAULT_FAVICON =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect fill="%23ddd" width="16" height="16" rx="2"/></svg>';

interface SuggestionItemProps {
  suggestion: Suggestion;
}

export const SuggestionItem = ({ suggestion }: SuggestionItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={suggestion.url}
      className="group relative flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-white/95 px-2 py-1 text-xs shadow-sm transition-all duration-150 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
      title={suggestion.url}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ textDecoration: 'none' }}>
      <img
        src={suggestion.faviconUrl}
        alt=""
        className="h-4 w-4 shrink-0"
        onError={e => {
          e.currentTarget.src = DEFAULT_FAVICON;
        }}
      />

      <span
        className="max-w-[140px] truncate text-gray-700"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {suggestion.title || suggestion.url}
      </span>

      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-100 px-1 text-[10px] font-semibold text-emerald-700">
        {suggestion.matchCount}
      </span>

      {isHovered && <SuggestionItemActions url={suggestion.url} />}
    </a>
  );
};
