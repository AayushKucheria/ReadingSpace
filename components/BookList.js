'use client';

import { useMemo, useState } from 'react';
import { BookItem } from '@/components/BookItem';

const BOOKS_PER_PAGE = 20;

function sortBooks(books, sortBy) {
  const sorted = [...books];

  if (sortBy === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'author') {
    sorted.sort((a, b) => a.author.localeCompare(b.author));
  } else if (sortBy === 'rating') {
    sorted.sort((a, b) => {
      const ratingA = typeof a.average_rating === 'number' ? a.average_rating : 0;
      const ratingB = typeof b.average_rating === 'number' ? b.average_rating : 0;
      return ratingB - ratingA;
    });
  }

  return sorted;
}

export function BookList({ books }) {
  const [sortBy, setSortBy] = useState('title');
  const [filterText, setFilterText] = useState('');
  const [page, setPage] = useState(1);

  const filteredBooks = useMemo(() => {
    if (!filterText.trim()) {
      return books;
    }

    const query = filterText.toLowerCase();
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
    );
  }, [books, filterText]);

  const sortedBooks = useMemo(
    () => sortBooks(filteredBooks, sortBy),
    [filteredBooks, sortBy]
  );

  const totalPages = Math.max(1, Math.ceil(sortedBooks.length / BOOKS_PER_PAGE));
  const currentBooks = sortedBooks.slice(
    (page - 1) * BOOKS_PER_PAGE,
    page * BOOKS_PER_PAGE
  );

  const handleFilterChange = (event) => {
    setFilterText(event.target.value);
    setPage(1);
  };

  return (
    <div className="book-list">
      <div className="book-list-controls">
        <div className="filter-container">
          <input
            type="text"
            placeholder="Filter by title or author…"
            value={filterText}
            onChange={handleFilterChange}
          />
        </div>

        <div className="sort-container">
          <label htmlFor="book-sort">Sort by:</label>
          <select
            id="book-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      <div className="books-container">
        {currentBooks.length > 0 ? (
          currentBooks.map((book) => <BookItem key={book.id} book={book} />)
        ) : (
          <div className="no-books">
            {filterText ? 'No books match your filter.' : 'No books available.'}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="page-info">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

