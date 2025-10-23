# ReadingSpace

![license](https://img.shields.io/badge/license-MIT-blue.svg)

A semantic search application for book discovery. ReadingSpace lets you explore your personal library using natural language—find books matching concepts, themes, or emotions, even if the words never appear in the description.

## Features

- **📚 Library Sync**: Import your Bookwyrm shelves (to-read, reading, read, custom) with a single click
- **🔍 Semantic Search**: Describe any concept, theme, or emotion to find matching books
- **🔄 Similar Book Discovery**: Easily find books similar to ones you already enjoy
- **⚡ Embedding-Powered**: Uses OpenAI embedding models for fast semantic similarity scoring
- **💾 Local-first data**: Books & embeddings are stored in your browser so you stay in control of your library
- **📝 Activity-aware context**: Sync metadata, personal reviews, and ratings persist locally for richer recommendations next session
- **🎯 Single strong suggestion mode**: Let the app shortlist a top match, get a concise LLM summary, and reroll with feedback when you want another idea

## Demo

![Screenshot of BooksSpace](https://via.placeholder.com/800x450?text=BooksSpace+Screenshot)

## Technologies Used

- **Framework**: Next.js (App Router)
- **UI**: React 18 with vanilla CSS
- **API**: Serverless route running on Vercel
- **Embeddings**: OpenAI `text-embedding-3-small` (configurable)
- **Storage**: Browser IndexedDB for local persistence

## Prerequisites

- Node.js 18.18+ or 20+
- npm 9+
- An OpenAI API key with access to the embeddings endpoint
- A Bookwyrm account with public shelves (instance domain + username)

## Quick Start

```bash
npm install
cp .env.example .env.local  # Add your OpenAI API key
npm run dev
```

Run `npm test` to execute the importer integration tests that mock Bookwyrm responses.

Visit http://localhost:3000, sync your Bookwyrm shelves, and start searching.

## Usage

1. **Sync Your Library**: Enter your Bookwyrm instance + username, choose shelves, and click "Sync Library"
2. **Explore Your Books**: Browse your complete book collection
3. **Semantic Search**: Use natural language to search for books by concepts, themes, or emotions
4. **Discover Similar Books**: Click on any book to find similar titles in your collection

## How It Works

ReadingSpace keeps the entire experience inside your browser while calling a single serverless function for embeddings:

1. The client requests `/api/bookwyrm`, which fetches and normalizes your selected public shelves through Bookwyrm's ActivityPub endpoints.
2. The response includes clean metadata plus text snippets that describe each edition.
3. Those snippets are batched to `/api/embed`, which forwards to OpenAI for embeddings.
4. Embeddings and book data are stored in IndexedDB (browser storage) so refreshes keep your library.

This keeps the deployment lightweight—no stateful backend, no database, and nothing to maintain outside Vercel.

## Environment Variables

Create `.env.local` with:

```
OPENAI_API_KEY=sk-...
# Optional overrides
# OPENAI_EMBEDDING_MODEL=text-embedding-3-small
# EMBED_BATCH_SIZE=32
# OPENAI_RECOMMENDATION_MODEL=gpt-4o-mini
```

## Deployment (Vercel)

1. Push the repo to GitHub/GitLab.
2. Create a new Vercel project pointing at the repo.
3. Add `OPENAI_API_KEY` (and any optional overrides) in the Vercel dashboard.
4. Deploy — the default build command is `npm run build`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) for the full-stack framework
- [OpenAI](https://openai.com/) for the embeddings API
- [idb-keyval](https://github.com/jakearchibald/idb-keyval) for simple IndexedDB persistence
