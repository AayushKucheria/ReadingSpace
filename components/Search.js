'use client';

import { useEffect, useState } from 'react';

const RATING_THRESHOLDS = [4.5, 4.0, 3.5];

export function Search({ onSearch, searching, filters = {} }) {
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('list');
  const [selectedShelves, setSelectedShelves] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [minRating, setMinRating] = useState('any');

  useEffect(() => {
    if (!Array.isArray(filters.shelves)) {
      return;
    }
    setSelectedShelves((current) =>
      current.filter((slug) => filters.shelves.some((shelf) => shelf.slug === slug))
    );
  }, [filters.shelves]);

  useEffect(() => {
    if (!Array.isArray(filters.subjects)) {
      return;
    }
    setSelectedSubjects((current) => current.filter((subject) => filters.subjects.includes(subject)));
  }, [filters.subjects]);

  const toggleShelf = (slug) => {
    setSelectedShelves((current) => {
      if (current.includes(slug)) {
        return current.filter((value) => value !== slug);
      }
      return [...current, slug];
    });
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects((current) => {
      if (current.includes(subject)) {
        return current.filter((value) => value !== subject);
      }
      return [...current, subject];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!searchText.trim()) {
      setError('Please enter a search query.');
      return;
    }

    setError(null);
    try {
      await onSearch({
        query: searchText,
        mode,
        filters: {
          shelves: selectedShelves,
          subjects: selectedSubjects,
          minRating: minRating === 'any' ? null : Number(minRating)
        }
      });
      const url = new URL(window.location.href);
      url.searchParams.set('q', searchText);
      url.searchParams.set('mode', mode);
      window.history.replaceState({}, '', url);
    } catch (searchError) {
      setError(searchError.message ?? 'Search failed. Please try again.');
    }
  };

  const applyExample = (example) => {
    setSearchText(example);
    setError(null);
  };

  return (
    <div className="search-container">
      <h2>Discover Books Through Ideas</h2>

      <div className="search-description">
        <p>
          Explore your library with natural language. Describe any concept, theme, or emotion,
          and semantic search will find matching books—even if they never mention those exact
          words.
        </p>
      </div>

      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-primary">
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="What kind of story are you looking for today?"
            disabled={searching}
          />

          <button type="submit" disabled={searching || !searchText.trim()}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>

        <fieldset className="search-mode-toggle">
          <legend>Recommendation mode</legend>
          <label>
            <input
              type="radio"
              name="search-mode"
              value="list"
              checked={mode === 'list'}
              onChange={() => setMode('list')}
              disabled={searching}
            />
            Full results
          </label>
          <label>
            <input
              type="radio"
              name="search-mode"
              value="single"
              checked={mode === 'single'}
              onChange={() => setMode('single')}
              disabled={searching}
            />
            Single strong suggestion
          </label>
        </fieldset>

        {Array.isArray(filters.shelves) && filters.shelves.length > 0 && (
          <fieldset className="search-filter-group">
            <legend>Filter by shelf</legend>
            <div className="filter-options">
              {filters.shelves.map((shelf) => (
                <label key={shelf.slug}>
                  <input
                    type="checkbox"
                    checked={selectedShelves.includes(shelf.slug)}
                    onChange={() => toggleShelf(shelf.slug)}
                    disabled={searching}
                  />
                  <span>{shelf.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {Array.isArray(filters.subjects) && filters.subjects.length > 0 && (
          <fieldset className="search-filter-group">
            <legend>Subjects to include</legend>
            <div className="filter-options">
              {filters.subjects.map((subject) => (
                <label key={subject}>
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject)}
                    onChange={() => toggleSubject(subject)}
                    disabled={searching}
                  />
                  <span>{subject}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="rating-filter">
          <label htmlFor="min-rating">Minimum personal rating</label>
          <select
            id="min-rating"
            value={minRating}
            onChange={(event) => setMinRating(event.target.value)}
            disabled={searching}
          >
            <option value="any">Any rating</option>
            {RATING_THRESHOLDS.map((threshold) => (
              <option key={threshold} value={threshold}>
                {threshold}+ stars
              </option>
            ))}
          </select>
        </div>
      </form>

      {error && <div className="search-error">{error}</div>}

      <div className="search-examples">
        <h3>Try searching for:</h3>
        <ul>
          <li onClick={() => applyExample('books about personal growth and overcoming adversity')}>
            Personal growth and overcoming adversity
          </li>
          <li onClick={() => applyExample('magical realism with historical elements')}>
            Magical realism with historical elements
          </li>
          <li onClick={() => applyExample('detective stories with unreliable narrators')}>
            Detective stories with unreliable narrators
          </li>
          <li onClick={() => applyExample('books that made me feel hopeful')}>
            Books that make me feel hopeful
          </li>
          <li onClick={() => applyExample('dystopian futures with philosophical themes')}>
            Dystopian futures with philosophical themes
          </li>
        </ul>
      </div>
    </div>
  );
}
