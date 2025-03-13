import React from 'react';
import '../styles/BookCard.css';

export const BookCard = ({ book, onClick, showSimilarity = false }) => {
  return (
    <div className="book-card" onClick={onClick}>
      <div className="book-cover">
        <div className="placeholder-cover">
          <span>{book.title ? book.title.charAt(0).toUpperCase() : '?'}</span>
        </div>
      </div>
      
      <div className="book-info">
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
        
        {showSimilarity && book.similarity && (
          <div className="similarity-score">
            <span className="score-label">Match:</span>
            <span className="score-value">{Math.round(book.similarity * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}; 