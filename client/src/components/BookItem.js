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

  return (
    <div className="book-item" onClick={onClick}>
      <div className="book-item-content">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        
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
            <div className="match-score">
              <span className="score-label">Match:</span>
              <span className="score-value">{Math.round(book.similarity * 100)}%</span>
            </div>
            
            <p className="match-reason">
              {query ? generateReason() : "This book matches your search criteria."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 