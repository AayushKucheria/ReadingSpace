'use client';

import { useMemo, useState } from 'react';

function cleanIsbn(value) {
  if (!value) {
    return null;
  }

  return String(value)
    .replace(/^=/, '')
    .replace(/^"(.*)"$/, '$1')
    .replace(/^'(.*)'$/, '$1')
    .trim();
}

function stripJsonSuffix(url) {
  if (!url) {
    return null;
  }
  const match = url.match(/^(.*?)(\.json)(\?.*)?$/);
  if (!match) {
    return url;
  }
  const [, base, , query] = match;
  return `${base}${query ?? ''}`;
}

function resolveBookwyrmUrl(book) {
  const candidates = [book.url, book.id, book.activityUrl];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string') {
      const link = stripJsonSuffix(candidate);
      if (link) {
        return link;
      }
    }
  }

  if (book.instanceDomain && book.isbn13) {
    return `https://${book.instanceDomain}/search?q=${encodeURIComponent(book.isbn13)}`;
  }

  if (book.instanceDomain) {
    const query = encodeURIComponent(`${book.title} ${book.author}`);
    return `https://${book.instanceDomain}/search?q=${query}`;
  }

  return null;
}

function formatList(items) {
  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function extractFirstSentence(description) {
  if (!description) {
    return null;
  }

  const trimmed = description.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/([^.!?]+[.!?])\s/);
  if (match) {
    return match[1].trim();
  }

  return trimmed.length > 220 ? `${trimmed.slice(0, 217)}…` : trimmed;
}

function extractNote(entry) {
  if (!entry?.content) {
    return null;
  }
  const content = entry.content.replace(/<[^>]+>/g, '').trim();
  if (!content) {
    return null;
  }
  return content.length > 180 ? `${content.slice(0, 177)}…` : content;
}

function buildMatchNarrative(book, query) {
  const fragments = [];
  const trimmedQuery = query ? query.trim() : '';
  const subjects = Array.isArray(book.subjects)
    ? book.subjects.filter(Boolean).slice(0, 3)
    : [];

  if (trimmedQuery && subjects.length > 0) {
    fragments.push(`Connects your "${trimmedQuery}" prompt with ${formatList(subjects)}.`);
  } else if (trimmedQuery) {
    fragments.push(`Reflects the mood of "${trimmedQuery}" using your collection.`);
  } else if (subjects.length > 0) {
    fragments.push(`Centers on ${formatList(subjects)}.`);
  }

  if (book.shelfLabel) {
    fragments.push(`Lives on your “${book.shelfLabel}” shelf.`);
  }

  const activity = book.activity;
  const latestEntry = Array.isArray(activity?.entries) ? activity.entries[0] : null;
  const note = extractNote(latestEntry);

  if (note) {
    fragments.push(`Your latest note reads: “${note}”`);
  } else {
    const firstSentence = extractFirstSentence(book.description);
    if (firstSentence) {
      fragments.push(firstSentence);
    }
  }

  if (fragments.length === 0) {
    return 'This title sits close to the emotional shape of your prompt.';
  }

  return fragments.join(' ');
}

function toLocaleDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  return parsed.toLocaleDateString();
}

export function BookItem({ book, query, mode = 'concept', spotlight = false }) {
  const [expanded, setExpanded] = useState(false);

  const isbn = cleanIsbn(book.isbn);
  const isbn13 = cleanIsbn(book.isbn13);

  const bookwyrmUrl = resolveBookwyrmUrl(book);

  const amazonUrl = isbn
    ? `https://www.amazon.com/dp/${isbn}`
    : isbn13
      ? `https://www.amazon.com/s?k=${isbn13}`
      : `https://www.amazon.com/s?k=${encodeURIComponent(`${book.title} ${book.author} book`)}`;

  const personalAverageRating =
    typeof book.activity?.averageRating === 'number' &&
    Number.isFinite(book.activity.averageRating)
      ? book.activity.averageRating
      : null;
  const personalRatingsCount = book.activity?.ratingsCount ?? 0;

  const similarity =
    typeof book.similarity === 'number' ? `${Math.round(book.similarity * 100)}% match` : null;

  const titleDisplay = book.title || 'Untitled';
  const authorDisplay = book.author ? `by ${book.author}` : 'Author unknown';

  const latestEntry = useMemo(
    () => (Array.isArray(book.activity?.entries) ? book.activity.entries[0] ?? null : null),
    [book.activity]
  );

  const hasExtendedMetadata = Boolean(
    book.description ||
      (Array.isArray(book.subjects) && book.subjects.length > 0) ||
      latestEntry ||
      personalAverageRating !== null
  );

  const onCardClick = () => {
    if (hasExtendedMetadata) {
      setExpanded((value) => !value);
    } else if (bookwyrmUrl) {
      window.open(bookwyrmUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleExternalLink = (event, url) => {
    event.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const matchNarrative = useMemo(
    () => buildMatchNarrative(book, mode === 'concept' ? query : null),
    [book, mode, query]
  );

  const description = useMemo(() => {
    if (!book.description) {
      return null;
    }

    const trimmed = book.description.replace(/<[^>]+>/g, '').trim();
    return trimmed ? trimmed : null;
  }, [book.description]);

  const subjects = useMemo(() => {
    if (!Array.isArray(book.subjects)) {
      return [];
    }
    return book.subjects.filter(Boolean);
  }, [book.subjects]);

  const latestEntryDate = latestEntry?.publishedAt ? toLocaleDate(latestEntry.publishedAt) : null;

  return (
    <div
      className={`book-item${expanded ? ' expanded' : ''}${spotlight ? ' spotlight' : ''}`}
      onClick={onCardClick}
    >
      <div className="book-item-content">
        <div className="book-header">
          <div className="book-main-info">
            <h3 className="book-title">{titleDisplay}</h3>
            <p className="book-author">{authorDisplay}</p>
          </div>

          {similarity && <div className="match-badge">{similarity}</div>}
        </div>

        <div className="book-metadata">
          {book.shelfLabel && <span className="book-shelf-tag">{book.shelfLabel}</span>}
          {personalAverageRating !== null && personalRatingsCount > 0 && (
            <span className="book-rating-chip">
              Your avg {personalAverageRating.toFixed(1)}
              {book.activity?.ratingScaleMax ? `/${book.activity.ratingScaleMax}` : ''}
            </span>
          )}
        </div>

        <p className="match-narrative">{matchNarrative}</p>

        {expanded && (
          <div className="book-details">
            {description && (
              <div className="book-detail-block">
                <h4>Synopsis</h4>
                <p>{description}</p>
              </div>
            )}

            {subjects.length > 0 && (
              <div className="book-detail-block">
                <h4>Subjects</h4>
                <ul>
                  {subjects.map((subject) => (
                    <li key={subject}>{subject}</li>
                  ))}
                </ul>
              </div>
            )}

            {latestEntry && (
              <div className="book-detail-block">
                <h4>Recent activity</h4>
                <div className="activity-meta">
                  {latestEntry.type && <span className="activity-type">{latestEntry.type}</span>}
                  {latestEntryDate && <span className="activity-date">{latestEntryDate}</span>}
                  {latestEntry.rating != null && (
                    <span className="activity-rating">
                      {Number(latestEntry.rating).toFixed(1)}
                      {latestEntry.ratingScaleMax ? `/${latestEntry.ratingScaleMax}` : ''}
                    </span>
                  )}
                </div>
                {latestEntry.content && <p>{latestEntry.content}</p>}
              </div>
            )}
          </div>
        )}

        <div className="book-actions">
          <div className="book-external-links">
            {bookwyrmUrl && (
              <button
                type="button"
                className="external-link bookwyrm-link"
                onClick={(event) => handleExternalLink(event, bookwyrmUrl)}
              >
                Open in Bookwyrm
              </button>
            )}
            <button
              type="button"
              className="external-link amazon-link"
              onClick={(event) => handleExternalLink(event, amazonUrl)}
            >
              Search Amazon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
