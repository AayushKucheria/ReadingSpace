'use client';

const EMBEDDING_ENDPOINT = '/api/embed';
const BOOKWYRM_IMPORT_ENDPOINT = '/api/bookwyrm';
const RECOMMENDATION_ENDPOINT = '/api/recommend';

export async function fetchEmbeddings(inputs) {
  const response = await fetch(EMBEDDING_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error ?? 'Failed to generate embeddings';
    throw new Error(message);
  }

  const payload = await response.json();

  if (!payload || !Array.isArray(payload.embeddings)) {
    throw new Error('Embedding response was malformed');
  }

  return payload.embeddings;
}

export async function importBookwyrmLibrary(options) {
  const body = {
    instanceDomain: options?.instanceDomain,
    username: options?.username,
    shelves: options?.shelves,
    shelfState: options?.shelfState
  };

  const response = await fetch(BOOKWYRM_IMPORT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error ?? 'Failed to import Bookwyrm shelves';
    throw new Error(message);
  }

  const payload = await response.json();

  if (!payload || !Array.isArray(payload.books)) {
    throw new Error('Bookwyrm import response was malformed');
  }

  return payload;
}

export async function requestRecommendationSummary(options) {
  const response = await fetch(RECOMMENDATION_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options ?? {})
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error ?? 'Failed to generate suggestion summary.';
    throw new Error(message);
  }

  const payload = await response.json();

  if (!payload || typeof payload.summary !== 'string') {
    throw new Error('Recommendation response was malformed.');
  }

  return payload;
}
