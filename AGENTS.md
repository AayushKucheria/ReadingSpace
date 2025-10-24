# Repository Guidelines

## Project Overview
- **Purpose**: ReadingSpace is a semantic search application for personal book libraries, helping readers discover titles via natural-language queries.
- **Tech Stack**: Next.js (App Router) with React 18, serverless API routes, and OpenAI-powered embeddings for semantic search.

## Local Setup
1. Install dependencies: `npm install`
2. Copy the environment template: `cp .env.example .env.local`
3. Start the development server: `npm run dev`
   - The app runs at http://localhost:3000.

## Environment Variables
- **Required**: `OPENAI_API_KEY`
- **Optional overrides** (define in `.env.local` as needed):
  - `OPENAI_EMBEDDING_MODEL` (defaults to `text-embedding-3-small`)
  - `EMBED_BATCH_SIZE` (defaults to `32`)
  - `OPENAI_RECOMMENDATION_MODEL` (defaults to `gpt-4o-mini`)

## Routine Checks
- Run tests: `npm test`
- Lint the project: `npm run lint`
- Default deployment build: `npm run build`

## Coding Conventions
- Prefer functional React components and hooks.
- Compose features from small, focused components.
- Follow the default `eslint-config-next` ruleset.

## Commit & PR Expectations
1. Fork, branch, implement, test, and open a pull request (5-step flow).
2. Write present-tense, descriptive commit messages.
3. Ensure automated checks pass before requesting review.
