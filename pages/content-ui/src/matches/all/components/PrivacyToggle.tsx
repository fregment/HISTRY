interface PrivacyToggleProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const PrivacyToggle = ({ isVisible, onToggle }: PrivacyToggleProps) => (
  <button
    onClick={onToggle}
    className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
    title={isVisible ? 'Hide suggestions' : 'Show suggestions'}>
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-200 ${isVisible ? '' : 'rotate-180'}`}>
      <path
        d="M2 4.5L6 8.5L10 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);
