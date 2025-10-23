'use client';

import { del, get, set } from 'idb-keyval';

const BOOKS_STORAGE_KEY = 'readingspace/books/v2';
const SYNC_STATE_STORAGE_KEY = 'readingspace/sync-state/v1';

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
