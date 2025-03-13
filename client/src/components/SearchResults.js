import React, { useState } from 'react';
import { BookItem } from './BookItem';
import '../styles/SearchResults.css';

export const SearchResults = ({ results, type, onSelectBook, query = '' }) => {
  const [displayCount, setDisplayCount] = useState(3); // Initially show 3 results
  
  // Handle case where results is a single book (for similar search)
  const isDetailView = type === 'similar' && !Array.isArray(results);
  const searchResults = isDetailView ? results.similarity : results;
  
  // Generate a suitable query for similar books if none is provided
  const effectiveQuery = isDetailView && !query 
    ? `books similar to "${results.title}"`
    : query;
  
  const renderDetailHeader = () => {
    if (!isDetailView) return null;
    
    return (
      <div className="detail-header">
        <h2>Books Similar to "{results.title}"</h2>
        <p>Based on themes, style, and content</p>
      </div>
    );
  };
  
  const renderConceptHeader = () => {
    if (type !== 'concept' || !Array.isArray(results)) return null;
    
    return (
      <div className="concept-header">
        <h2>Search Results</h2>
        <p>Showing {Math.min(displayCount, results.length)} of {results.length} books matching your search</p>
      </div>
    );
  };
  
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 2); // Load 2 more books
  };
  
  return (
    <div className="search-results">
      {renderDetailHeader()}
      {renderConceptHeader()}
      
      <div className="results-list">
        {Array.isArray(searchResults) && searchResults.length > 0 ? (
          searchResults.slice(0, displayCount).map(book => (
            <BookItem
              key={book.id}
              book={book}
              onClick={onSelectBook}
              query={effectiveQuery}
            />
          ))
        ) : (
          <div className="no-results">
            <p>No matching books found.</p>
          </div>
        )}
      </div>
      
      {Array.isArray(searchResults) && searchResults.length > displayCount && (
        <div className="load-more-container">
          <button className="load-more-button" onClick={handleLoadMore}>
            Load More Books
          </button>
        </div>
      )}
    </div>
  );
}; 