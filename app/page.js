'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookList } from '@/components/BookList';
import { LibrarySync } from '@/components/LibrarySync';
import { OpenAiSettings } from '@/components/OpenAiSettings';
import { Search } from '@/components/Search';
import { SearchResults } from '@/components/SearchResults';
import { fetchEmbeddings, requestRecommendationSummary } from '@/lib/api';
import { cosineSimilarity } from '@/lib/embeddings';
import {
  clearBooks,
  clearSyncState,
  loadBooks,
  loadOpenAiKey,
  loadSyncState,
  saveBooks,
  saveSyncState
} from '@/lib/storage';

const CONCEPT_RESULTS_LIMIT = 20;
const SINGLE_SUGGESTION_POOL_SIZE = 5;

export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [activeView, setActiveView] = useState('sync');
  const [searchState, setSearchState] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [searching, setSearching] = useState(false);
  const [syncState, setSyncState] = useState(null);
  const [openAiKey, setOpenAiKey] = useState(null);

  const updateOpenAiKey = useCallback((nextKey) => {
    if (typeof nextKey === 'string') {
      const trimmed = nextKey.trim();
      setOpenAiKey(trimmed.length > 0 ? trimmed : null);
      return;
    }
    setOpenAiKey(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const [storedBooks, storedSync, storedKey] = await Promise.all([
          loadBooks(),
          loadSyncState(),
          loadOpenAiKey()
        ]);

        if (!cancelled && Array.isArray(storedBooks) && storedBooks.length > 0) {
          setBooks(storedBooks);
          setActiveView('search');
        }

        if (!cancelled && storedSync) {
          setSyncState(storedSync);
        }

        if (!cancelled) {
          updateOpenAiKey(storedKey ?? null);
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [updateOpenAiKey]);

  const canSearch = useMemo(() => books.length > 0, [books.length]);
  const ensureApiKey = useCallback(() => {
    const trimmed = typeof openAiKey === 'string' ? openAiKey.trim() : '';
    if (!trimmed) {
      throw new Error('Add your OpenAI API key in Settings before searching.');
    }
    return trimmed;
  }, [openAiKey]);

  const generateSuggestion = useCallback(async (query, candidates, index) => {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new Error('No candidates available for suggestions.');
    }

    const boundedIndex =
      ((index % candidates.length) + candidates.length) % candidates.length;
    const candidate = candidates[boundedIndex];

    const payload = {
      query,
      book: {
        id: candidate.id,
        title: candidate.title,
        author: candidate.author,
        description: candidate.description,
        subjects: candidate.subjects,
        activity: candidate.activity ?? null,
        shelfLabel: candidate.shelfLabel ?? null
      }
    };

    const apiKey = ensureApiKey();
    const response = await requestRecommendationSummary(payload, apiKey);
    return {
      index: boundedIndex,
      book: candidate,
      summary: response.summary,
      feedback: null
    };
  }, [ensureApiKey]);

  const handleLibraryImported = async ({ books: uploadedBooks, syncInfo }) => {
    setBooks(uploadedBooks);
    setSearchState(null);
    setActiveView('search');
    setSyncState(syncInfo ?? null);

    await Promise.all([saveBooks(uploadedBooks), saveSyncState(syncInfo ?? null)]);
  };

  const handleConceptSearch = async (searchRequest) => {
    if (!canSearch) {
      throw new Error('Sync your Bookwyrm library before running a search.');
    }

    const request =
      typeof searchRequest === 'string'
        ? { query: searchRequest, mode: 'list' }
        : searchRequest ?? {};

    const query = typeof request.query === 'string' ? request.query.trim() : '';
    if (!query) {
      throw new Error('Please enter a search query.');
    }

    const mode = request.mode === 'single' ? 'single' : 'list';

    setSearching(true);
    try {
      const apiKey = ensureApiKey();
      const [embedding] = await fetchEmbeddings([query], apiKey);
      const filteredCollection = books.filter((book) => Array.isArray(book.embedding));

      if (filteredCollection.length === 0) {
        throw new Error('No books in your library are ready for semantic search.');
      }

      const ranked = filteredCollection
        .map((book) => ({
          ...book,
          similarity: cosineSimilarity(embedding, book.embedding)
        }))
        .sort((a, b) => b.similarity - a.similarity);

      if (mode === 'single') {
        const candidates = ranked.slice(0, SINGLE_SUGGESTION_POOL_SIZE);
        if (candidates.length === 0) {
          throw new Error('No books available for suggestions.');
        }
        const suggestion = await generateSuggestion(query, candidates, 0);
        setSearchState({
          type: 'single',
          query,
          candidates,
          currentIndex: suggestion.index,
          suggestion
        });
      } else {
        const results = ranked.slice(0, CONCEPT_RESULTS_LIMIT);
        setSearchState({
          type: 'concept',
          results,
          query
        });
      }
      setActiveView('search');
    } finally {
      setSearching(false);
    }
  };

  const handleSuggestionFeedback = useCallback((feedback) => {
    setSearchState((previous) => {
      if (!previous || previous.type !== 'single' || !previous.suggestion) {
        return previous;
      }
      return {
        ...previous,
        suggestion: {
          ...previous.suggestion,
          feedback
        }
      };
    });
  }, []);

  const handleSuggestionReroll = useCallback(async () => {
    if (!searchState || searchState.type !== 'single') {
      return;
    }

    const { candidates, query, suggestion } = searchState;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return;
    }

    const nextIndex = ((suggestion?.index ?? -1) + 1) % candidates.length;

    setSearching(true);
    try {
      const nextSuggestion = await generateSuggestion(query, candidates, nextIndex);
      setSearchState((previous) => {
        if (!previous || previous.type !== 'single') {
          return previous;
        }
        return {
          ...previous,
          currentIndex: nextSuggestion.index,
          suggestion: nextSuggestion
        };
      });
    } finally {
      setSearching(false);
    }
  }, [generateSuggestion, searchState]);

  const handleClearLibrary = async () => {
    setBooks([]);
    setSearchState(null);
    setActiveView('sync');
    setSyncState(null);
    await clearBooks();
    await clearSyncState();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>ReadingSpace</h1>
        <nav>
          <button
            type="button"
            className={activeView === 'search' ? 'active' : ''}
            onClick={() => setActiveView('search')}
            disabled={!canSearch}
          >
            Semantic Search
          </button>
          <button
            type="button"
            className={activeView === 'books' ? 'active' : ''}
            onClick={() => setActiveView('books')}
            disabled={!canSearch}
          >
            My Books
          </button>
          <button
            type="button"
            className={activeView === 'sync' ? 'active' : ''}
            onClick={() => setActiveView('sync')}
          >
            Sync Library
          </button>
          {canSearch && (
            <button type="button" onClick={handleClearLibrary}>
              Clear Library
            </button>
          )}
        </nav>
      </header>

      <main className="app-content">
        {initializing && <div className="loading">Loading your library…</div>}

        {!initializing && (
          <OpenAiSettings apiKey={openAiKey} onApiKeyChange={updateOpenAiKey} />
        )}

        {!initializing && activeView === 'sync' && (
          <LibrarySync
            onLibraryImported={handleLibraryImported}
            existingBooks={books}
            syncState={syncState}
            ensureApiKey={ensureApiKey}
          />
        )}

        {!initializing && activeView === 'books' && canSearch && <BookList books={books} />}

        {!initializing && activeView === 'search' && (
          <>
            <Search
              onSearch={handleConceptSearch}
              searching={searching}
              ensureApiKey={ensureApiKey}
            />
            <SearchResults
              state={searchState}
              onSuggestionFeedback={handleSuggestionFeedback}
              onRequestAnother={handleSuggestionReroll}
              searching={searching}
            />
          </div>
        )}
      </main>
    </div>
  );
}
