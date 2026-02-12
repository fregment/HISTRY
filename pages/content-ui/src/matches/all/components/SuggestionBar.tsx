import { SuggestionItem } from './SuggestionItem';
import type { Suggestion } from '@extension/histry-core';

interface SuggestionBarProps {
  suggestions: Suggestion[];
  isLoading: boolean;
}

export const SuggestionBar = ({ suggestions, isLoading }: SuggestionBarProps) => {
  if (isLoading) {
    return <div className="flex items-center px-3 py-1 text-xs text-gray-400">Loading suggestions...</div>;
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto px-2 py-1"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
      {suggestions.map(suggestion => (
        <SuggestionItem key={suggestion.url} suggestion={suggestion} />
      ))}
    </div>
  );
};
