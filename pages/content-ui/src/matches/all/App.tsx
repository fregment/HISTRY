import { BarContainer } from './components/BarContainer';
import { PrivacyToggle } from './components/PrivacyToggle';
import { SuggestionBar } from './components/SuggestionBar';
import { useBarVisibility } from './hooks/useBarVisibility';
import { useSuggestions } from './hooks/useSuggestions';

export default function App() {
  const { suggestions, isLoading } = useSuggestions();
  const { isVisible, toggle } = useBarVisibility();

  // Don't render anything if there are no suggestions and we're done loading
  if (!isLoading && suggestions.length === 0) return null;

  return (
    <BarContainer isVisible={isVisible}>
      <PrivacyToggle isVisible={isVisible} onToggle={toggle} />
      {isVisible && <SuggestionBar suggestions={suggestions} isLoading={isLoading} />}
    </BarContainer>
  );
}
