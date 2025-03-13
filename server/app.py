from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import os
import json
import requests
from io import BytesIO
from embeddings import EmbeddingManager

app = Flask(__name__)
CORS(app)

# Initialize embedding manager
embedding_manager = EmbeddingManager()

@app.route('/api/upload', methods=['POST'])
def upload_library():
    """Handle Goodreads CSV upload and process books."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'File must be a CSV'}), 400
    
    try:
        # Save CSV temporarily
        temp_path = 'temp_upload.csv'
        file.save(temp_path)
        
        # Process CSV with pandas
        books_df = pd.read_csv(temp_path)
        
        # Clean and transform data
        required_columns = ['Title', 'Author', 'ISBN']
        
        # Check if all required columns exist (with different possible Goodreads column names)
        goodreads_mappings = {
            'Title': ['Title', 'title', 'Book Title'],
            'Author': ['Author', 'author', 'Authors', 'Author l-f'],
            'ISBN': ['ISBN', 'isbn', 'ISBN13', 'isbn13']
        }
        
        for required, possible_names in goodreads_mappings.items():
            found = False
            for name in possible_names:
                if name in books_df.columns:
                    if name != required:
                        books_df[required] = books_df[name]
                    found = True
                    break
            if not found:
                return jsonify({'error': f"Required column {required} not found"}), 400
        
        # Process books with embedding manager
        books_data = embedding_manager.process_books(books_df)
        
        # Clean up
        os.remove(temp_path)
        
        return jsonify({
            'message': 'Library uploaded successfully',
            'bookCount': len(books_data),
            'books': books_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search/similar', methods=['POST'])
def search_similar():
    """Find books similar to a specified book."""
    data = request.json
    if not data or 'bookId' not in data:
        return jsonify({'error': 'No book ID provided'}), 400
    
    try:
        book_id = data['bookId']
        limit = data.get('limit', 10)
        
        similar_books = embedding_manager.find_similar_books(book_id, limit)
        return jsonify(similar_books)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search/concept', methods=['POST'])
def search_by_concept():
    """Search for books related to a described concept/theme."""
    data = request.json
    if not data or 'query' not in data:
        return jsonify({'error': 'No query provided'}), 400
    
    try:
        query = data['query']
        limit = data.get('limit', 10)
        
        matching_books = embedding_manager.search_by_concept(query, limit)
        return jsonify(matching_books)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/books', methods=['GET'])
def get_books():
    """Return all processed books."""
    try:
        books = embedding_manager.get_all_books()
        return jsonify(books)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cover-proxy', methods=['GET'])
def cover_proxy():
    """Proxy for book cover images to avoid CORS issues."""
    source = request.args.get('source')
    url = request.args.get('url')
    
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    
    try:
        response = requests.get(url, timeout=5)
        
        if response.status_code != 200:
            return jsonify({'error': f'Source returned {response.status_code}'}), 404
            
        # Check if the response is an actual image (not a placeholder or error page)
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            return jsonify({'error': 'Not an image'}), 404
            
        # Check if the image is too small (likely a placeholder)
        if int(response.headers.get('Content-Length', 0)) < 1000:
            return jsonify({'error': 'Image too small (likely placeholder)'}), 404
            
        # Return the image
        return send_file(
            BytesIO(response.content),
            mimetype=content_type
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 