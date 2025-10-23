# Contributing to ReadingSpace

Thank you for considering contributing to ReadingSpace! This document outlines the guidelines and workflows for contributing to this project.

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

ReadingSpace is a single Next.js application. To get started:

1. Install dependencies
   ```bash
   npm install
   ```

2. Copy the environment template and add your OpenAI key
   ```bash
   cp .env.example .env.local
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

The app will be available at http://localhost:3000.

## Coding Conventions

### JavaScript/React

- Use functional components and hooks
- Prefer small, composable components
- Add comments for complex logic
- Follow the default `eslint-config-next` guidelines

## Testing

- Write tests for new features (unit or integration)
- Ensure existing tests pass before submitting pull requests (`npm test`, `npm run lint`)

## Documentation

- Update the README.md if necessary
- Document new features or changes in behavior
- Include comments in code for complex algorithms or logic

## Commit Messages

- Use clear and descriptive commit messages
- Start with a verb in the present tense (e.g., "Add feature" not "Added feature")
- Reference issue numbers when applicable

Thank you for contributing to BooksSpace! 
