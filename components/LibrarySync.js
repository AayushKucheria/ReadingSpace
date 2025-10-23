'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchEmbeddings, importBookwyrmLibrary } from '@/lib/api';
import { buildEmbeddingInput } from '@/lib/books';

const EMBEDDING_BATCH_SIZE = 64;
const DEFAULT_INSTANCE = 'bookwyrm.social';

const DEFAULT_SHELVES = [
  { slug: 'to-read', label: 'To Read' },
  { slug: 'reading', label: 'Currently Reading' },
  { slug: 'read', label: 'Read' }
];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function generateEmbeddings(inputs, onProgress) {
  if (!inputs || inputs.length === 0) {
    if (onProgress) {
      onProgress(100);
    }
    return [];
  }

  const embeddings = [];

  for (let i = 0; i < inputs.length; i += EMBEDDING_BATCH_SIZE) {
    const chunk = inputs.slice(i, i + EMBEDDING_BATCH_SIZE);
    // eslint-disable-next-line no-await-in-loop
    const response = await fetchEmbeddings(chunk);
    embeddings.push(...response);

    if (onProgress) {
      const completed = Math.min(embeddings.length, inputs.length);
      onProgress(Math.round((completed / inputs.length) * 100));
    }
  }

  return embeddings;
}

function isDefaultShelf(slug) {
  return DEFAULT_SHELVES.some((shelf) => shelf.slug === slug);
}

function buildShelfStatePayload(shelfStates, selectedShelves) {
  if (!shelfStates) {
    return {};
  }

  return selectedShelves.reduce((acc, slug) => {
    const record = shelfStates[slug];
    if (!record || typeof record !== 'object') {
      return acc;
    }

    const entry = {};
    if (record.etag && typeof record.etag === 'string') {
      entry.etag = record.etag;
    }
    if (record.lastModified && typeof record.lastModified === 'string') {
      entry.lastModified = record.lastModified;
    }

    if (Object.keys(entry).length > 0) {
      acc[slug] = entry;
    }
    return acc;
  }, {});
}

function mergeShelfStates(previous = {}, next = {}) {
  const merged = { ...previous };
  Object.entries(next).forEach(([slug, state]) => {
    merged[slug] = {
      ...(previous[slug] ?? {}),
      ...state
    };
  });
  return merged;
}

function normalizeJsonUrl(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes('.json')) {
    return trimmed;
  }
  const [base, query] = trimmed.split('?');
  const withJson = `${base}.json`;
  return query ? `${withJson}?${query}` : withJson;
}

function buildActivityKeyCandidates(book) {
  const keys = [];
  if (book?.activityUrl && typeof book.activityUrl === 'string') {
    keys.push(book.activityUrl);
  }
  if (book?.id && typeof book.id === 'string') {
    const normalized = normalizeJsonUrl(book.id);
    if (normalized) {
      keys.push(normalized);
    }
  }
  return keys;
}

async function hashTextSha256(text) {
  const source = typeof text === 'string' ? text : '';
  const encoder = new TextEncoder();
  const data = encoder.encode(source);

  if (typeof window !== 'undefined' && window.crypto?.subtle?.digest) {
    const buffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  throw new Error('Secure hashing is not supported in this environment.');
}

export function LibrarySync({ onLibraryImported, existingBooks = [], syncState = null }) {
  const [instanceDomain, setInstanceDomain] = useState(DEFAULT_INSTANCE);
  const [username, setUsername] = useState('');
  const [selectedShelves, setSelectedShelves] = useState(
    DEFAULT_SHELVES.map((shelf) => shelf.slug)
  );
  const [customShelfInput, setCustomShelfInput] = useState('');
  const [customShelves, setCustomShelves] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const shelfState = syncState?.shelfStates ?? {};
  const lastSyncedAt = syncState?.lastSyncedAt ?? null;
  const lastSyncedDate = lastSyncedAt ? new Date(lastSyncedAt) : null;
  const lastSyncedDisplay =
    lastSyncedDate && !Number.isNaN(lastSyncedDate.valueOf())
      ? lastSyncedDate.toLocaleString()
      : null;
  const hasExistingBooks = Array.isArray(existingBooks) && existingBooks.length > 0;

  useEffect(() => {
    if (!syncState) {
      setInstanceDomain(DEFAULT_INSTANCE);
      setUsername('');
      setSelectedShelves(DEFAULT_SHELVES.map((shelf) => shelf.slug));
      setCustomShelves([]);
      return;
    }

    setInstanceDomain(syncState.instanceDomain ?? DEFAULT_INSTANCE);
    setUsername(syncState.username ?? '');

    const hydratedShelves =
      Array.isArray(syncState.selectedShelves) && syncState.selectedShelves.length > 0
        ? syncState.selectedShelves
        : DEFAULT_SHELVES.map((shelf) => shelf.slug);

    setSelectedShelves(hydratedShelves);
    setCustomShelves(hydratedShelves.filter((slug) => !isDefaultShelf(slug)));
  }, [syncState]);

  const allShelves = useMemo(
    () => [
      ...DEFAULT_SHELVES,
      ...customShelves.map((slug) => ({ slug, label: slug }))
    ],
    [customShelves]
  );

  const activeShelves = useMemo(
    () => allShelves.filter((shelf) => selectedShelves.includes(shelf.slug)),
    [allShelves, selectedShelves]
  );

  const handleToggleShelf = (slug) => {
    setSelectedShelves((current) => {
      if (current.includes(slug)) {
        return current.filter((value) => value !== slug);
      }
      return [...current, slug];
    });
  };

  const handleAddCustomShelf = () => {
    if (!customShelfInput.trim()) {
      return;
    }

    const slug = slugify(customShelfInput);
    if (!slug) {
      setError('Custom shelf names must include at least one letter or number.');
      return;
    }

    setError(null);
    setCustomShelves((current) => {
      if (current.includes(slug)) {
        return current;
      }
      return [...current, slug];
    });
    setSelectedShelves((current) => {
      if (current.includes(slug)) {
        return current;
      }
      return [...current, slug];
    });
    setCustomShelfInput('');
  };

  const handleRemoveCustomShelf = (slug) => {
    setCustomShelves((current) => current.filter((value) => value !== slug));
    setSelectedShelves((current) => current.filter((value) => value !== slug));
  };

  const updateEmbeddingProgress = (percentage) => {
    setProgress(20 + Math.round((percentage / 100) * 80));
  };

  const handleExportLibrary = () => {
    try {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        books: Array.isArray(existingBooks) ? existingBooks : [],
        syncState: syncState ?? null
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `readingspace-library-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error('Failed to export library', exportError);
      setError('Failed to export library. Please try again.');
    }
  };

  const handleTriggerImport = () => {
    if (syncing) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0] ?? null;
    if (event.target) {
      // Reset so selecting the same file again retriggers change.
      // eslint-disable-next-line no-param-reassign
      event.target.value = '';
    }

    if (!file) {
      return;
    }

    setSyncing(true);
    setError(null);
    setProgress(5);

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload || !Array.isArray(payload.books)) {
        throw new Error('Invalid backup file format.');
      }

      const importedBooks = payload.books;
      const importedSync =
        payload.syncState && typeof payload.syncState === 'object'
          ? payload.syncState
          : null;

      setProgress(100);
      if (onLibraryImported) {
        await onLibraryImported({
          books: importedBooks,
          syncInfo: importedSync
        });
      }
    } catch (importError) {
      console.error('Failed to import library', importError);
      setError(importError.message ?? 'Failed to import backup. Please verify the file.');
    } finally {
      setSyncing(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const handleSyncLibrary = async () => {
    if (syncing) {
      return;
    }

    const trimmedInstance = instanceDomain.trim() || DEFAULT_INSTANCE;
    const trimmedUsername = username.trim();

    if (!username.trim()) {
      setError('Enter your Bookwyrm username.');
      return;
    }

    if (selectedShelves.length === 0) {
      setError('Select at least one shelf to import.');
      return;
    }

    setSyncing(true);
    setError(null);
    setProgress(5);

    try {
      const selectedShelfList = Array.from(new Set(selectedShelves));
      const priorBooks = Array.isArray(existingBooks) ? existingBooks : [];

      const response = await importBookwyrmLibrary({
        instanceDomain: trimmedInstance,
        username: trimmedUsername,
        shelves: selectedShelfList,
        shelfState: buildShelfStatePayload(shelfState, selectedShelfList)
      });

      const fetchedBooks = Array.isArray(response?.books) ? response.books : [];
      const shelfStates = response?.shelfStates ?? {};
      const activityUpdates = response?.activityByBook ?? {};
      const activityMap = new Map(
        Object.entries(activityUpdates).filter(
          ([key, value]) => typeof key === 'string' && value
        )
      );

      const getActivityForBook = (book) => {
        const candidates = buildActivityKeyCandidates(book);
        for (const candidate of candidates) {
          if (candidate && activityMap.has(candidate)) {
            return activityMap.get(candidate);
          }
        }
        return null;
      };

      const hasExistingForSelection = priorBooks.some((book) =>
        selectedShelfList.includes(book.shelf)
      );

      if (fetchedBooks.length === 0 && !hasExistingForSelection) {
        throw new Error('No books were found on the selected shelves.');
      }

      setProgress(20);

      const existingById = new Map(
        priorBooks
          .filter((book) => book?.id)
          .map((book) => [book.id, book])
      );

      const embeddingTasks = [];

      const updatedBooks = fetchedBooks.map((book) => {
        const activityRecord = getActivityForBook(book);
        const enrichedBook = activityRecord ? { ...book, activity: activityRecord } : book;

        const existing = existingById.get(enrichedBook.id);
        if (
          existing &&
          Array.isArray(existing.embedding) &&
          existing.embeddingHash &&
          existing.embeddingHash === enrichedBook.embeddingHash
        ) {
          return {
            ...enrichedBook,
            embedding: existing.embedding
          };
        }

        if (!enrichedBook.embeddingInput) {
          throw new Error(`Missing embedding input for "${enrichedBook.title ?? 'Untitled'}".`);
        }

        const placeholder = { ...enrichedBook, embedding: null };
        embeddingTasks.push({
          input: enrichedBook.embeddingInput,
          assign: (embedding) => {
            placeholder.embedding = embedding;
          }
        });
        return placeholder;
      });

      const carryOverBooks = [];
      const carryOverProcessing = [];

      priorBooks.forEach((book) => {
        if (!book?.shelf) {
          return;
        }
        if (!selectedShelfList.includes(book.shelf)) {
          return;
        }
        const shelfInfo = shelfStates[book.shelf];
        if (shelfInfo?.status !== 'not-modified') {
          return;
        }

        const carryOver = { ...book };
        const previousHash = book.embeddingHash ?? null;
        const activityRecord = getActivityForBook(book);
        if (activityRecord) {
          carryOver.activity = activityRecord;
        }
        carryOverBooks.push(carryOver);

        carryOverProcessing.push(
          (async () => {
            const embeddingInput = buildEmbeddingInput(carryOver);
            const nextHash = await hashTextSha256(embeddingInput);
            carryOver.embeddingInput = embeddingInput;
            carryOver.embeddingHash = nextHash;

            if (!Array.isArray(carryOver.embedding) || previousHash !== nextHash) {
              embeddingTasks.push({
                input: embeddingInput,
                assign: (embedding) => {
                  carryOver.embedding = embedding;
                }
              });
            }
          })()
        );
      });

      await Promise.all(carryOverProcessing);

      if (embeddingTasks.length > 0) {
        const embeddingInputs = embeddingTasks.map((task) => task.input);
        const embeddings = await generateEmbeddings(embeddingInputs, updateEmbeddingProgress);
        embeddings.forEach((embedding, embedIndex) => {
          embeddingTasks[embedIndex].assign(embedding);
        });
      } else {
        updateEmbeddingProgress(100);
      }

      const sanitizedCarryOver = carryOverBooks.map(({ embeddingInput, ...rest }) => rest);
      const sanitizedUpdated = updatedBooks.map(({ embeddingInput, ...rest }) => rest);
      const combinedBooks = [...sanitizedCarryOver, ...sanitizedUpdated];

      setProgress(100);

      const nextSyncInfo = {
        instanceDomain: trimmedInstance,
        username: trimmedUsername,
        selectedShelves: selectedShelfList,
        lastSyncedAt: new Date().toISOString(),
        shelfStates: mergeShelfStates(shelfState, shelfStates)
      };

      onLibraryImported?.({ books: combinedBooks, syncInfo: nextSyncInfo });
    } catch (syncError) {
      console.error('Failed to sync Bookwyrm library', syncError);
      setError(syncError.message ?? 'Failed to sync Bookwyrm library. Please try again.');
    } finally {
      setSyncing(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  return (
    <div className="book-upload">
      <h2>Sync Your Bookwyrm Library</h2>
      <p className="upload-subheading">
        ReadingSpace pulls public data from your Bookwyrm shelves, then generates embeddings for
        semantic search. Shelves must be public and visible to guests.
      </p>

      <div className="upload-instructions">
        <h3>What you need:</h3>
        <ul>
          <li>Your Bookwyrm instance domain (e.g. <code>bookwyrm.social</code>)</li>
          <li>Your username</li>
          <li>At least one public shelf to import</li>
        </ul>
      </div>

      {(lastSyncedAt || Object.keys(shelfState).length > 0) && (
        <div className="sync-status">
          {(lastSyncedDisplay || lastSyncedAt) && (
            <p>
              Last sync completed on{' '}
              <strong>{lastSyncedDisplay ?? lastSyncedAt}</strong>
            </p>
          )}
          {selectedShelves.length > 0 && (
            <ul>
              {selectedShelves.map((slug) => {
                const info = shelfState[slug];
                if (!info) {
                  return (
                    <li key={slug}>
                      {slug} — not synced yet
                    </li>
                  );
                }
                const parts = [];
                if (info.status) {
                  parts.push(info.status);
                }
                if (info.lastModified) {
                  parts.push(`Last-Modified: ${info.lastModified}`);
                } else if (info.etag) {
                  parts.push(`ETag: ${info.etag}`);
                }
                return (
                  <li key={slug}>
                    {slug} — {parts.join(' • ')}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="sync-form">
        <label htmlFor="bookwyrm-instance">Instance Domain</label>
        <input
          id="bookwyrm-instance"
          type="text"
          value={instanceDomain}
          onChange={(event) => setInstanceDomain(event.target.value)}
          placeholder="bookwyrm.social"
          disabled={syncing}
        />

        <label htmlFor="bookwyrm-username">Username</label>
        <input
          id="bookwyrm-username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Your username"
          disabled={syncing}
        />

        <fieldset className="shelf-selector">
          <legend>Shelves to import</legend>
          <div className="shelf-options">
            {allShelves.map((shelf) => (
              <label key={shelf.slug} className="shelf-option">
                <input
                  type="checkbox"
                  checked={selectedShelves.includes(shelf.slug)}
                  onChange={() => handleToggleShelf(shelf.slug)}
                  disabled={syncing}
                />
                <span>{shelf.label}</span>
                {customShelves.includes(shelf.slug) && (
                  <button
                    type="button"
                    className="remove-shelf-button"
                    onClick={() => handleRemoveCustomShelf(shelf.slug)}
                    disabled={syncing}
                  >
                    Remove
                  </button>
                )}
              </label>
            ))}
          </div>

          <div className="custom-shelf">
            <input
              type="text"
              value={customShelfInput}
              placeholder="Add custom shelf (e.g. favorites)"
              onChange={(event) => setCustomShelfInput(event.target.value)}
              disabled={syncing}
            />
            <button type="button" onClick={handleAddCustomShelf} disabled={syncing}>
              Add Shelf
            </button>
          </div>
        </fieldset>
      </div>

      <div className="backup-actions">
        <button
          type="button"
          onClick={handleExportLibrary}
          disabled={syncing || !hasExistingBooks}
        >
          Export Library
        </button>
        <button type="button" onClick={handleTriggerImport} disabled={syncing}>
          Import Library
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {syncing && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <div className="progress-text">
            {progress < 100 ? 'Syncing your shelves…' : 'Complete!'}
          </div>
        </div>
      )}

      <button type="button" className="upload-button" onClick={handleSyncLibrary} disabled={syncing}>
        {syncing ? 'Syncing…' : `Sync ${activeShelves.length} Shelf${activeShelves.length !== 1 ? 'es' : ''}`}
      </button>
    </div>
  );
}
