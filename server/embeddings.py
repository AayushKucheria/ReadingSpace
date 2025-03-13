from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
import os
import pandas as pd

class EmbeddingManager:
    def __init__(self):
        # Load efficient, high-quality embedding model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.books = []
        self.embeddings = []
        self.book_ids_map = {}  # Maps book IDs to indices
        
        # Create data directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
        
        # Try to load existing data
        self._load_data()
    
    def _load_data(self):
        """Load existing book data and embeddings if available."""
        try:
            if os.path.exists('data/books.json'):
                with open('data/books.json', 'r') as f:
                    self.books = json.load(f)
                
            if os.path.exists('data/embeddings.npy'):
                self.embeddings = np.load('data/embeddings.npy')
                
            # Rebuild book ID map
            self.book_ids_map = {book['id']: i for i, book in enumerate(self.books)}
        except Exception as e:
            print(f"Error loading data: {e}")
            # Start fresh if there's an error
            self.books = []
            self.embeddings = []
            self.book_ids_map = {}
    
    def _save_data(self):
        """Save book data and embeddings."""
        try:
            with open('data/books.json', 'w') as f:
                json.dump(self.books, f)
            
            np.save('data/embeddings.npy', self.embeddings)
        except Exception as e:
            print(f"Error saving data: {e}")
    
    def process_books(self, books_df):
        """Process books from DataFrame, generate embeddings and save."""
        # Reset existing data
        self.books = []
        self.embeddings = []
        self.book_ids_map = {}
        
        # Clean data and prepare for embedding
        texts = []
        
        for i, row in books_df.iterrows():
            # Generate unique ID
            book_id = f"book_{i}"
            
            # Extract title and author
            title = row['Title'] if not pd.isna(row['Title']) else "Unknown Title"
            author = row['Author'] if not pd.isna(row['Author']) else "Unknown Author"
            
            # Create text for embedding
            embedding_text = f"Title: {title}. Author: {author}."
            
            # Add additional metadata if available
            if 'Average Rating' in row and not pd.isna(row['Average Rating']):
                rating = row['Average Rating']
                embedding_text += f" Rating: {rating}."
            
            if 'My Rating' in row and not pd.isna(row['My Rating']) and row['My Rating'] > 0:
                my_rating = row['My Rating']
                embedding_text += f" My Rating: {my_rating}."
                
            if 'Bookshelves' in row and not pd.isna(row['Bookshelves']):
                shelves = row['Bookshelves']
                embedding_text += f" Bookshelves: {shelves}."
            
            # Store book data
            book_data = {
                'id': book_id,
                'title': title,
                'author': author,
                'isbn': row['ISBN'] if not pd.isna(row['ISBN']) else None
            }
            
            # Add optional fields if available
            optional_fields = [
                'Average Rating', 'My Rating', 'Bookshelves', 
                'Year Published', 'Original Publication Year', 'Date Read',
                'Number of Pages', 'Publisher'
            ]
            
            for field in optional_fields:
                if field in row and not pd.isna(row[field]):
                    book_data[field.lower().replace(' ', '_')] = row[field]
            
            self.books.append(book_data)
            texts.append(embedding_text)
            self.book_ids_map[book_id] = len(self.books) - 1
        
        # Generate embeddings in batches
        batch_size = 32
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            batch_embeddings = self.model.encode(batch_texts, convert_to_numpy=True)
            all_embeddings.append(batch_embeddings)
        
        self.embeddings = np.vstack(all_embeddings)
        
        # Save data
        self._save_data()
        
        return self.books
    
    def find_similar_books(self, book_id, limit=10):
        """Find books similar to the specified book."""
        if not self.books or book_id not in self.book_ids_map:
            return []
        
        book_idx = self.book_ids_map[book_id]
        book_embedding = self.embeddings[book_idx].reshape(1, -1)
        
        # Calculate similarity
        similarities = cosine_similarity(book_embedding, self.embeddings).flatten()
        
        # Get top similar books (excluding the query book)
        similar_indices = np.argsort(-similarities)
        similar_indices = similar_indices[similar_indices != book_idx][:limit]
        
        result = []
        for idx in similar_indices:
            book = self.books[idx].copy()
            book['similarity'] = float(similarities[idx])
            result.append(book)
        
        return result
    
    def search_by_concept(self, query, limit=10):
        """Search for books related to the described concept/theme."""
        if not self.books:
            return []
        
        # Generate embedding for the query
        query_embedding = self.model.encode(query, convert_to_numpy=True).reshape(1, -1)
        
        # Calculate similarity
        similarities = cosine_similarity(query_embedding, self.embeddings).flatten()
        
        # Get top matching books
        top_indices = np.argsort(-similarities)[:limit]
        
        result = []
        for idx in top_indices:
            book = self.books[idx].copy()
            book['similarity'] = float(similarities[idx])
            result.append(book)
        
        return result
    
    def get_all_books(self):
        """Return all processed books."""
        return self.books 