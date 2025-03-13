import React from 'react';
import '../styles/BookItem.css';

export const BookItem = ({ book, onClick, query }) => {
  // Generate a plausible reason for the match based on available data
  const generateReason = () => {
    // Check if this is a similarity search or concept search
    const isSimilaritySearch = query && query.includes('similar to');
    
    // Different reason templates based on search type
    if (isSimilaritySearch) {
      const reasons = [
        `Both books explore similar themes and narrative structures.`,
        `This book shares stylistic and thematic elements with the original.`,
        `Readers who enjoyed the original also appreciated this book.`,
        `The writing style and character development are comparable.`,
        `This book offers a similar reading experience and emotional journey.`
      ];
      
      // Use the book's id to deterministically select a reason
      const reasonIndex = book.id.charCodeAt(book.id.length - 1) % reasons.length;
      return reasons[reasonIndex];
    } else {
      // Original templates for concept searches
      const reasons = [
        `This book's themes align with your interest in "${query}".`,
        `The narrative style of this book matches your search for "${query}".`,
        `Elements of "${query}" are present in this book's central themes.`,
        `The semantic patterns in this book relate to your query "${query}".`,
        `This book's thematic elements strongly relate to "${query}".`
      ];
      
      // Use the book's id to deterministically select a reason
      const reasonIndex = book.id.charCodeAt(book.id.length - 1) % reasons.length;
      return reasons[reasonIndex];
    }
  };

  // Handle external link clicks without triggering the parent onClick
  const handleExternalLinkClick = (e, url) => {
    e.stopPropagation(); // Prevent the parent onClick from firing
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle find similar button click
  const handleFindSimilar = (e) => {
    e.stopPropagation(); // Prevent the parent click from firing
    if (onClick) {
      onClick(book);
    }
  };

  // Create link URLs based on book data
  const getGoodreadsUrl = () => {
    // Clean ISBN format: remove equals sign prefix and any quotes
    const cleanIsbn = (isbn) => {
      if (!isbn) return null;
      return isbn.toString().replace(/^=/, '').replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();
    };

    const isbn = cleanIsbn(book.isbn);
    const isbn13 = cleanIsbn(book.isbn13);

    if (isbn) {
      return `https://www.goodreads.com/book/isbn/${isbn}`;
    } else if (isbn13) {
      return `https://www.goodreads.com/book/isbn/${isbn13}`;
    }
    // Fallback to search by title and author
    const searchQuery = encodeURIComponent(`${book.title} ${book.author}`);
    return `https://www.goodreads.com/search?q=${searchQuery}`;
  };

  const getAmazonUrl = () => {
    // Clean ISBN format: remove equals sign prefix and any quotes
    const cleanIsbn = (isbn) => {
      if (!isbn) return null;
      return isbn.toString().replace(/^=/, '').replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();
    };

    const isbn = cleanIsbn(book.isbn);
    const isbn13 = cleanIsbn(book.isbn13);

    // For books, the ASIN is often the same as the ISBN-10
    if (isbn) {
      // Direct to product page if possible
      return `https://www.amazon.com/dp/${isbn}`;
    } else if (isbn13) {
      // ISBN-13 doesn't work as an ASIN, so use search
      return `https://www.amazon.com/s?k=${isbn13}`;
    }
    // Fallback to search by title and author
    const searchQuery = encodeURIComponent(`${book.title} ${book.author} book`);
    return `https://www.amazon.com/s?k=${searchQuery}`;
  };

  return (
    <div className="book-item">
      <div className="book-item-content">
        <div className="book-header">
          <div className="book-main-info">
            <h3 className="book-title">{book.title}</h3>
            <p className="book-author">by {book.author}</p>
          </div>
          
          {book.similarity && (
            <div className="match-badge">
              <span className="match-percentage">{Math.round(book.similarity * 100)}%</span>
            </div>
          )}
        </div>
        
        {book.average_rating && (
          <div className="book-rating">
            <span className="stars">
              {Array(Math.round(book.average_rating))
                .fill('★')
                .join('')}
            </span>
            <span className="rating-value">
              {Number(book.average_rating).toFixed(1)}
            </span>
          </div>
        )}
        
        {book.similarity && (
          <div className="match-container">
            <p className="match-reason">
              {query ? generateReason() : "This book matches your search criteria."}
            </p>
          </div>
        )}

        <div className="book-actions">
          {onClick && (
            <button 
              className="action-button find-similar-button"
              onClick={handleFindSimilar}
              title="Find similar books"
            >
              Find Similar
            </button>
          )}
          
          <div className="book-external-links">
            <button 
              className="external-link goodreads-link"
              onClick={(e) => handleExternalLinkClick(e, getGoodreadsUrl())}
              title="View on Goodreads"
            >
              Goodreads
            </button>
            <button 
              className="external-link amazon-link"
              onClick={(e) => handleExternalLinkClick(e, getAmazonUrl())}
              title="View on Amazon"
            >
              Amazon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 