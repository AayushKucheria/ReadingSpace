# BooksSpace

![license](https://img.shields.io/badge/license-MIT-blue.svg)

A semantic search application for book discovery. BooksSpace allows you to explore your personal library using natural language - find books matching concepts, themes, or emotions, even if they don't contain those exact words.

## Features

- **📚 Personal Library Management**: Upload your Goodreads CSV export to import your book collection
- **🔍 Semantic Search**: Describe any concept, theme, or emotion to find matching books
- **🔄 Similar Book Discovery**: Easily find books similar to ones you already enjoy
- **⚡ Embedding-Powered**: Utilizes state-of-the-art text embeddings for understanding book contexts

## Demo

![Screenshot of BooksSpace](https://via.placeholder.com/800x450?text=BooksSpace+Screenshot)

## Technologies Used

- **Frontend**: React.js
- **Backend**: Python (Flask)
- **NLP**: Sentence-transformers for text embeddings
- **Data Processing**: NumPy, Pandas

## Prerequisites

- Python 3.8+ for the backend
- Node.js (v16 or higher) for the frontend
- npm (v7 or higher)
- A Goodreads library export (CSV format)

## Installation and Setup

### Backend Setup

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/BooksSpace.git
cd BooksSpace
```

2. Create and activate a virtual environment
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Run the Flask server
```bash
python app.py
```
The server will start on http://localhost:5000

### Frontend Setup

1. Navigate to the client directory
```bash
cd client
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```
The application will open in your browser at http://localhost:3000

## Usage

1. **Upload Your Library**: Click on "Upload Library" and select your Goodreads CSV export
2. **Explore Your Books**: Browse your complete book collection
3. **Semantic Search**: Use natural language to search for books by concepts, themes, or emotions
4. **Discover Similar Books**: Click on any book to find similar titles in your collection

## How It Works

BooksSpace uses embedding-based semantic search to find similarities between book descriptions and your search queries:

1. Each book's metadata (title, author, shelves) is converted to an embedding vector
2. Your search query is also converted to an embedding vector 
3. The system finds books whose embeddings are closest to your query's embedding
4. Results are ranked by similarity score

This approach enables finding thematically similar books even when specific keywords aren't present.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Sentence-Transformers](https://www.sbert.net/) for the embedding models
- [React](https://reactjs.org/) and [Flask](https://flask.palletsprojects.com/) for the application framework
- All contributors and open source projects that made this possible 