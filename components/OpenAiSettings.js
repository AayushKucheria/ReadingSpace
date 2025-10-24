'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { clearOpenAiKey, saveOpenAiKey } from '@/lib/storage';

function sanitizeKey(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

export function OpenAiSettings({ apiKey, onApiKeyChange }) {
  const [inputValue, setInputValue] = useState(() => sanitizeKey(apiKey));
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInputValue(sanitizeKey(apiKey));
  }, [apiKey]);

  const hasStoredKey = useMemo(() => sanitizeKey(apiKey).length > 0, [apiKey]);

  const handleSave = useCallback(
    async (event) => {
      event.preventDefault();
      if (busy) {
        return;
      }

      const trimmed = sanitizeKey(inputValue);
      if (!trimmed) {
        setError('Enter your OpenAI API key to enable semantic search.');
        setStatus(null);
        return;
      }

      if (!trimmed.startsWith('sk-')) {
        setError('That does not look like an OpenAI key. Keys typically start with "sk-".');
        setStatus(null);
        return;
      }

      setBusy(true);
      setError(null);
      setStatus(null);

      try {
        const saved = await saveOpenAiKey(trimmed);
        if (onApiKeyChange) {
          onApiKeyChange(saved);
        }
        setStatus('API key saved to your browser.');
      } catch (saveError) {
        console.error('Failed to store OpenAI key', saveError);
        setError('Failed to save your key. Please try again.');
      } finally {
        setBusy(false);
      }
    },
    [busy, inputValue, onApiKeyChange]
  );

  const handleClear = useCallback(async () => {
    if (busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await clearOpenAiKey();
      setInputValue('');
      if (onApiKeyChange) {
        onApiKeyChange(null);
      }
      setStatus('API key removed from this browser.');
    } catch (clearError) {
      console.error('Failed to clear OpenAI key', clearError);
      setError('Failed to clear your key. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [busy, onApiKeyChange]);

  return (
    <section className="openai-settings">
      <h2>OpenAI access</h2>
      <p className="settings-description">
        Store your OpenAI API key locally so ReadingSpace can request embeddings and summaries on your behalf.
      </p>
      <form onSubmit={handleSave} className="settings-form">
        <label htmlFor="openai-api-key">API key</label>
        <input
          id="openai-api-key"
          type="password"
          autoComplete="off"
          value={inputValue}
          placeholder="sk-..."
          onChange={(event) => {
            setInputValue(event.target.value);
            setError(null);
            setStatus(null);
          }}
        />
        {error && <p className="settings-error">{error}</p>}
        {status && !error && <p className="settings-status">{status}</p>}
        <div className="settings-actions">
          <button type="submit" disabled={busy}>
            {hasStoredKey ? 'Update key' : 'Save key'}
          </button>
          {hasStoredKey && (
            <button type="button" className="secondary" onClick={handleClear} disabled={busy}>
              Clear key
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
