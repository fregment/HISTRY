import { useState } from 'react';

interface SuggestionItemActionsProps {
  url: string;
}

export const SuggestionItemActions = ({ url }: SuggestionItemActionsProps) => {
  const [acted, setActed] = useState(false);

  if (acted) return null;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: 'LIKE_URL', payload: { url } });
    setActed(true);
  };

  const handleBlock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: 'BLOCK_URL', payload: { url } });
    setActed(true);
  };

  return (
    <div className="absolute -right-1 -top-1 flex gap-0.5">
      <button
        onClick={handleLike}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[8px] text-white shadow-sm transition-transform hover:scale-110"
        title="Pin this suggestion">
        +
      </button>
      <button
        onClick={handleBlock}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white shadow-sm transition-transform hover:scale-110"
        title="Remove this suggestion">
        x
      </button>
    </div>
  );
};
