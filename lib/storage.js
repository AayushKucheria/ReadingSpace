'use client';

import { del, get, set } from 'idb-keyval';

const BOOKS_STORAGE_KEY = 'readingspace/books/v2';
const SYNC_STATE_STORAGE_KEY = 'readingspace/sync-state/v1';
const OPENAI_KEY_STORAGE_KEY = 'readingspace/openai-key/v1';

function coerceStoredSecret(payload) {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof payload === 'object') {
    if (typeof payload.value === 'string') {
      const trimmed = payload.value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    if (typeof payload.secret === 'string') {
      const trimmed = payload.secret.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return null;
}

export async function loadBooks() {
  try {
    return (await get(BOOKS_STORAGE_KEY)) ?? null;
  } catch (error) {
    console.error('Failed to load books from storage', error);
    return null;
  }
}

export async function saveBooks(data) {
  try {
    await set(BOOKS_STORAGE_KEY, data);
  } catch (error) {
    console.error('Failed to persist books to storage', error);
  }
}

export async function clearBooks() {
  try {
    await del(BOOKS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear books from storage', error);
  }
}

export async function loadSyncState() {
  try {
    return (await get(SYNC_STATE_STORAGE_KEY)) ?? null;
  } catch (error) {
    console.error('Failed to load sync state from storage', error);
    return null;
  }
}

export async function saveSyncState(data) {
  try {
    if (data == null) {
      await del(SYNC_STATE_STORAGE_KEY);
      return;
    }
    await set(SYNC_STATE_STORAGE_KEY, data);
  } catch (error) {
    console.error('Failed to persist sync state to storage', error);
  }
}

export async function clearSyncState() {
  try {
    await del(SYNC_STATE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear sync state from storage', error);
  }
}

export async function loadOpenAiKey() {
  try {
    const stored = await get(OPENAI_KEY_STORAGE_KEY);
    const value = coerceStoredSecret(stored);
    if (!value) {
      return null;
    }
    return value;
  } catch (error) {
    console.error('Failed to load OpenAI key from storage', error);
    return null;
  }
}

export async function saveOpenAiKey(value) {
  try {
    const sanitized = typeof value === 'string' ? value.trim() : '';
    if (!sanitized) {
      await del(OPENAI_KEY_STORAGE_KEY);
      return null;
    }

    const payload = { type: 'plain', value: sanitized };
    await set(OPENAI_KEY_STORAGE_KEY, payload);
    return sanitized;
  } catch (error) {
    console.error('Failed to persist OpenAI key to storage', error);
    throw error;
  }
}

export async function clearOpenAiKey() {
  try {
    await del(OPENAI_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear OpenAI key from storage', error);
  }
}
