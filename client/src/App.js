import React, { useState, useEffect } from 'react';
import { BookUpload } from './components/BookUpload';
import { BookList } from './components/BookList';
import { Search } from './components/Search';
import { SearchResults } from './components/SearchResults';
import { apiGetBooks, apiSearchSimilar } from './services/api';
import './styles/App.css';

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [activeView, setActiveView] = useState('search'); // 'upload', 'books', 'search'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Updated useEffect to still respect available books but prioritize search view
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const response = await apiGetBooks();
        if (response && response.length > 0) {
          setBooks(response);
          // Switch to search view if we have books
          setActiveView('search');
        } else {
          // If no books, we need the upload view
          setActiveView('upload');
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        setActiveView('upload'); // Fallback to upload on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooks();
  }, []);
  
  const handleBooksUploaded = (newBooks) => {
    setBooks(newBooks);
    setActiveView('books');
  };
  
  const handleSearch = async (results, type, query = '') => {
    setLoading(type === 'similar');
    
    if (type === 'similar') {
      try {
        // For similar search, we need to fetch similar books
        const similarBooks = await apiSearchSimilar(results.id);
        
        // Include the original book and the similar books
        setSearchResults({ 
          results: {
            ...results,          // Original book details
            similarity: similarBooks // Array of similar books
          }, 
          type 
        });
      } catch (error) {
        console.error('Error fetching similar books:', error);
        // Still set results but with empty similarity array
        setSearchResults({ 
          results: {
            ...results,
            similarity: []
          }, 
          type 
        });
      } finally {
        setLoading(false);
      }
    } else {
      // For concept search, results is already the array of books
      setSearchResults({ results, type });
    }
    
    setSearchQuery(query);
    setActiveView('search');
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>Book Explorer</h1>
        <nav>
          <button 
            className={activeView === 'search' ? 'active' : ''}
            onClick={() => setActiveView('search')}
            disabled={books.length === 0}
          >
            Semantic Search
          </button>
          <button 
            className={activeView === 'books' ? 'active' : ''}
            onClick={() => setActiveView('books')}
            disabled={books.length === 0}
          >
            My Books
          </button>
          <button 
            className={activeView === 'upload' ? 'active' : ''}
            onClick={() => setActiveView('upload')}
          >
            Upload Library
          </button>
        </nav>
      </header>
      
      <main className="app-content">
        {loading && <div className="loading">Loading...</div>}
        
        {activeView === 'upload' && (
          <BookUpload onBooksUploaded={handleBooksUploaded} />
        )}
        
        {activeView === 'books' && books.length > 0 && (
          <BookList books={books} onSelectBook={(book) => handleSearch(book, 'similar')} />
        )}
        
        {activeView === 'search' && (
          <>
            <Search books={books} onSearch={handleSearch} />
            {searchResults && (
              <SearchResults 
                results={searchResults.results} 
                type={searchResults.type}
                onSelectBook={(book) => handleSearch(book, 'similar')}
                query={searchQuery}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App; 