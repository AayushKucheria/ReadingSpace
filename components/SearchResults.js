'use client';

import { useEffect, useState } from 'react';
import { BookItem } from '@/components/BookItem';

const INITIAL_DISPLAY_COUNT = 3;
const LOAD_MORE_COUNT = 3;

export function SearchResults({
  state,
  onSuggestionFeedback,
  onRequestAnother,
  searching
}) {
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  useEffect(() => {
    setDisplayCount(INITIAL_DISPLAY_COUNT);
  }, [state]);

  if (!state) {
    return null;
  }

  if (state.type === 'single') {
    const suggestion = state.suggestion;
    const book = suggestion?.book ?? null;

    return (
      <div className="search-results single-suggestion">
        <div className="concept-header">
          <h2>Spotlight Suggestion</h2>
          <p>Based on your concept: &ldquo;{state.query}&rdquo;</p>
        </div>

        {suggestion ? (
          <>
            <div className="suggestion-summary">{suggestion.summary}</div>
            {book && (
              <BookItem
                key={book.id}
                book={book}
                query={state.query}
                mode="concept"
                spotlight
              />
            )}

            <div className="suggestion-actions">
              <button
                type="button"
                className="suggestion-keep"
                onClick={() => onSuggestionFeedback?.('positive')}
                disabled={searching || suggestion.feedback === 'positive'}
              >
                Keep this suggestion
              </button>
              <button
                type="button"
                className="suggestion-reroll"
                onClick={() => {
                  onSuggestionFeedback?.('negative');
                  onRequestAnother?.();
                }}
                disabled={searching}
              >
                Try another
              </button>
            </div>

            {searching && (
              <div className="loading">Generating a new suggestion…</div>
            )}
            {suggestion.feedback === 'positive' && !searching && (
              <div className="feedback-note">Great! You can reroll to explore more choices.</div>
            )}
          </>
        ) : (
          <div className="loading">Preparing your suggestion…</div>
        )}
      </div>
    );
  }

  const results = state.results;
  const query = state.query;

  return (
    <div className="search-results">
      <div className="concept-header">
        <h2>Matching Books</h2>
        <p>
          Showing {Math.min(displayCount, results.length)} of {results.length} books that resonate
          with &ldquo;{query}&rdquo;
        </p>
      </div>

      <div className="results-list">
        {results.length > 0 ? (
          results.slice(0, displayCount).map((book) => (
            <BookItem
              key={book.id}
              book={book}
              query={query}
              mode="concept"
            />
          ))
        ) : (
          <div className="no-results">
            <p>No matching books found.</p>
          </div>
        )}
      </div>

      {results.length > displayCount && (
        <div className="load-more-container">
          <button
            type="button"
            className="load-more-button"
            onClick={() => setDisplayCount((count) => count + LOAD_MORE_COUNT)}
          >
            Load More Books
          </button>
        </div>
      )}
    </div>
  );
}
