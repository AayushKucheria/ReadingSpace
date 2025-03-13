import React, { useState } from 'react';
import { apiSearchByConcept } from '../services/api';
import '../styles/Search.css';

export const Search = ({ books, onSearch }) => {
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchText.trim()) {
      setError('Please enter a search query.');
      return;
    }
    
    setSearching(true);
    setError(null);
    
    try {
      const results = await apiSearchByConcept(searchText);
      onSearch(results, 'concept', searchText);
    } catch (error) {
      setError(error.message || 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };
  
  const updateUrl = (query) => {
    const url = new URL(window.location);
    url.searchParams.set('q', query);
    window.history.replaceState({}, '', url);
  };
  
  return (
    <div className="search-container">
      <h2>Discover Books Through Ideas</h2>
      
      <div className="search-description">
        <p>
          Explore your library with natural language. Describe any concept, theme, or 
          emotion, and our semantic search will find matching books - even if they 
          don't contain those exact words.
        </p>
      </div>
      
      <form className="search-form" onSubmit={(e) => {
        handleSearch(e);
        updateUrl(searchText);
      }}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="What kind of story are you looking for today?"
          disabled={searching}
        />
        
        <button 
          type="submit" 
          disabled={searching || !searchText.trim()}
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {error && <div className="search-error">{error}</div>}
      
      <div className="search-examples">
        <h3>Try searching for:</h3>
        <ul>
          <li onClick={() => setSearchText('books about personal growth and overcoming adversity')}>
            Personal growth and overcoming adversity
          </li>
          <li onClick={() => setSearchText('magical realism with historical elements')}>
            Magical realism with historical elements
          </li>
          <li onClick={() => setSearchText('detective stories with unreliable narrators')}>
            Detective stories with unreliable narrators
          </li>
          <li onClick={() => setSearchText('books that made me feel hopeful')}>
            Books that make me feel hopeful
          </li>
          <li onClick={() => setSearchText('dystopian futures with philosophical themes')}>
            Dystopian futures with philosophical themes
          </li>
        </ul>
      </div>
    </div>
  );
}; 