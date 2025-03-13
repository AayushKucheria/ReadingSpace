# BooksSpace

BooksSpace is a platform for book recommendations and exploration, providing a space for users to discover new books based on their preferences.

## Project Structure

- `client/`: React frontend application
- `server/`: Python backend API service

## Setup Instructions

### Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the server:
   ```
   python app.py
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Features

- Book recommendations based on user preferences
- Book exploration and discovery
- Search functionality for finding specific books

## Technologies Used

- **Frontend**: React.js
- **Backend**: Python (Flask)
- **Data Processing**: Embeddings-based recommendation system

## License

MIT 