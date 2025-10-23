'use client';

import { useCallback, useState } from 'react';

const EXAMPLE_PROMPTS = [
  'Rain needles the window while the kettle hums; I need a story that feels like quiet thunder to settle me.',
  'The museum closed hours ago, yet the smell of varnish and velvet still clings to me—I want to wander that hush on the page.',
  'City lights smear across the late-night train and I am a ghost between stations, craving prose that understands that in-between ache.',
  'I keep replaying a tender memory that tilts toward unease; recommend something that wrestles with softness and dread in equal measure.',
  'Point me to a book that keeps me curious about mossy trails, tidal pools, and every feral wonder in the natural world.',
  'My shelves need a voice that will let me stay curious without losing the sense of play that got me reading in the first place.'
];

export function Search({ onSearch, searching }) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState(null);

  const trimmedPrompt = prompt.trim();
  const actionsDisabled = searching || trimmedPrompt.length === 0;

  const runSearch = useCallback(
    async (mode) => {
      const query = prompt.trim();
      if (!query) {
        setError('Let the app know what is on your mind.');
        return;
      }

      setError(null);

      try {
        await onSearch({ query, mode, filters: {} });
        const url = new URL(window.location.href);
        url.searchParams.set('q', query);
        url.searchParams.set('mode', mode);
        window.history.replaceState({}, '', url);
      } catch (searchError) {
        setError(searchError.message ?? 'Something went wrong. Try again.');
      }
    },
    [onSearch, prompt]
  );

  const applyExample = useCallback((example) => {
    setPrompt(example);
    setError(null);
  }, []);

  return (
    <section className="context-search">
      <div className="context-shell">
        <header className="context-header">
          <p className="eyebrow">Context-first</p>
          <h2>What do you feel like reading?</h2>
          <p className="subtitle">
            Free-write a few lines about your mood, the themes you want to explore, or where
            you are right now. The system will translate that energy into a book from your library.
          </p>
        </header>

        <div className="context-input">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Pour out the atmosphere you want. Mention textures, emotions, memories—whatever feels true."
            disabled={searching}
            rows={8}
          />
        </div>

        {error && <div className="context-error">{error}</div>}

        <div className="context-actions">
          <button
            type="button"
            className="primary"
            onClick={() => runSearch('single')}
            disabled={actionsDisabled}
          >
            {searching ? 'Listening…' : 'Bring me one book'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => runSearch('list')}
            disabled={actionsDisabled}
          >
            {searching ? 'Searching…' : 'Show matching stack'}
          </button>
        </div>
      </div>

      <div className="context-examples">
        <p className="examples-label">Borrow a snippet of the kind of note you might leave for the system.</p>
        <div className="examples-list">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => applyExample(example)}
              disabled={searching}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
