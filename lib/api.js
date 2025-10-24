'use client';

const EMBEDDING_ENDPOINT = '/api/embed';
const BOOKWYRM_IMPORT_ENDPOINT = '/api/bookwyrm';
const RECOMMENDATION_ENDPOINT = '/api/recommend';

export async function fetchEmbeddings(inputs, apiKey) {
  const requestPayload = {
    inputs,
    apiKey
  };
  const response = await fetch(EMBEDDING_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestPayload)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = errorPayload.error ?? 'Failed to generate embeddings';
    throw new Error(message);
  }

  const responsePayload = await response.json();

  if (!responsePayload || !Array.isArray(responsePayload.embeddings)) {
    throw new Error('Embedding response was malformed');
  }

  return responsePayload.embeddings;
}

export async function importBookwyrmLibrary(options) {
  const requestPayload = {
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
    body: JSON.stringify(requestPayload)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = errorPayload.error ?? 'Failed to import Bookwyrm shelves';
    throw new Error(message);
  }

  const responsePayload = await response.json();

  if (!responsePayload || !Array.isArray(responsePayload.books)) {
    throw new Error('Bookwyrm import response was malformed');
  }

  return responsePayload;
}

export async function requestRecommendationSummary(options, apiKey) {
  const requestPayload = {
    ...(options ?? {}),
    apiKey
  };
  const response = await fetch(RECOMMENDATION_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestPayload)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = errorPayload.error ?? 'Failed to generate suggestion summary.';
    throw new Error(message);
  }

  const responsePayload = await response.json();

  if (!responsePayload || typeof responsePayload.summary !== 'string') {
    throw new Error('Recommendation response was malformed.');
  }

  return responsePayload;
}
