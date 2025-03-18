# Contributing to BooksSpace

Thank you for considering contributing to BooksSpace! This document outlines the guidelines and workflows for contributing to this project.

## Code of Conduct

Please be respectful and considerate of others when contributing. We aim to foster an inclusive and welcoming community.

## How Can I Contribute?

### Reporting Bugs

- Before creating a bug report, check existing issues to see if the problem has already been reported
- Use the bug report template when creating a new issue
- Include detailed steps to reproduce the bug
- Provide as much context as possible (OS, browser, etc.)

### Suggesting Enhancements

- Use the feature request template when suggesting enhancements
- Explain why this enhancement would be useful
- Consider including mockups or examples if applicable

### Pull Requests

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Submit a pull request

## Development Setup

### Backend (Python/Flask)

1. Set up a virtual environment
   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Run the Flask server
   ```bash
   python app.py
   ```

### Frontend (React)

1. Install dependencies
   ```bash
   cd client
   npm install
   ```

2. Start the development server
   ```bash
   npm start
   ```

## Coding Conventions

### Python (Backend)

- Follow PEP 8 style guidelines
- Use meaningful variable and function names
- Include docstrings for functions and classes
- Use type hints where appropriate

### JavaScript/React (Frontend)

- Use functional components and hooks
- Use meaningful component and variable names
- Add comments for complex logic
- Format code with Prettier

## Testing

- Write tests for new features
- Ensure existing tests pass before submitting pull requests
- For backend tests, use Python's unittest framework
- For frontend tests, use React Testing Library

## Documentation

- Update the README.md if necessary
- Document new features or changes in behavior
- Include comments in code for complex algorithms or logic

## Commit Messages

- Use clear and descriptive commit messages
- Start with a verb in the present tense (e.g., "Add feature" not "Added feature")
- Reference issue numbers when applicable

Thank you for contributing to BooksSpace! 