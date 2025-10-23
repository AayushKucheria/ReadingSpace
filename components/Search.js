'use client';

import { useCallback, useState } from 'react';

const EXAMPLE_PROMPTS = [
  'I want something tender yet unsettling that wrestles with memory.',
  'Give me a book to reset my attention and feel grounded again.',
  'What should I read to stay curious about the natural world?',
  'I need a hopeful story that still acknowledges hard realities.'
];

export function Search({ onSearch, searching, ensureApiKey }) {
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

      if (ensureApiKey) {
        try {
          ensureApiKey();
        } catch (keyError) {
          setError(
            keyError?.message ?? 'Add your OpenAI API key in Settings before searching.'
          );
          return;
        }
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
    [ensureApiKey, onSearch, prompt]
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
        <p className="examples-label">Need a spark?</p>
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
