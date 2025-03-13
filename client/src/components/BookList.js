import React, { useState } from 'react';
import { BookCard } from './BookCard';
import '../styles/BookList.css';

export const BookList = ({ books, onSelectBook }) => {
  const [sortBy, setSortBy] = useState('title');
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 20;
  
  // Filter and sort books
  const filteredBooks = books.filter(book => {
    const searchText = filterText.toLowerCase();
    return (
      book.title.toLowerCase().includes(searchText) ||
      book.author.toLowerCase().includes(searchText)
    );
  });
  
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'author') {
      return a.author.localeCompare(b.author);
    } else if (sortBy === 'rating' && 'average_rating' in a && 'average_rating' in b) {
      return b.average_rating - a.average_rating;
    }
    return 0;
  });
  
  // Pagination
  const totalPages = Math.ceil(sortedBooks.length / booksPerPage);
  const currentBooks = sortedBooks.slice(
    (currentPage - 1) * booksPerPage,
    currentPage * booksPerPage
  );
  
  return (
    <div className="book-list">
      <div className="book-list-controls">
        <div className="filter-container">
          <input
            type="text"
            placeholder="Filter by title or author..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setCurrentPage(1); // Reset to first page on filter
            }}
          />
        </div>
        
        <div className="sort-container">
          <label htmlFor="sort-select">Sort by:</label>
          <select 
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>
      
      <div className="books-container">
        {currentBooks.length > 0 ? (
          currentBooks.map(book => (
            <BookCard 
              key={book.id} 
              book={book} 
              onClick={() => onSelectBook(book)}
            />
          ))
        ) : (
          <div className="no-books">
            {filterText ? 'No books match your filter.' : 'No books available.'}
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}; 