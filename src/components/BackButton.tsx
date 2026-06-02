import { useNavigate } from 'react-router-dom';

// A small "← Back" control for sub-pages. Goes to the previous page in history;
// falls back to a sensible parent route if there's nothing to go back to
// (e.g. the page was opened directly via a deep link).
export function BackButton({ fallback = '/' }: { fallback?: string }) {
  const navigate = useNavigate();
  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallback);
  }
  return (
    <button onClick={goBack} className="btn btn-ghost" title="Back" aria-label="Back"
      style={{ padding: '8px 13px', fontSize: 16, lineHeight: 1 }}>←</button>
  );
}
