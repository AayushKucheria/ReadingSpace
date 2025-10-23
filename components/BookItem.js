'use client';

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

function buildReason(query, bookId) {
  if (!query) {
    return 'This book matches your search criteria.';
  }

  const templates = [
    `This book's themes align with your interest in "${query}".`,
    `The narrative style of this book matches your search for "${query}".`,
    `Elements of "${query}" are present in this book's central themes.`,
    `The semantic patterns in this book relate to your query "${query}".`,
    `This book's thematic elements strongly relate to "${query}".`
  ];

  const index = bookId.charCodeAt(bookId.length - 1) % templates.length;
  return templates[index];
}

function buildSimilarityReason(bookId) {
  const templates = [
    'Both books explore similar themes and narrative structures.',
    'This book shares stylistic and thematic elements with the original.',
    'Readers who enjoyed the original also appreciated this title.',
    'The writing style and character development are comparable.',
    'This book offers a similar reading experience and emotional journey.'
  ];

  const index = bookId.charCodeAt(bookId.length - 1) % templates.length;
  return templates[index];
}

export function BookItem({ book, onClick, query, mode = 'concept' }) {
  const handleFindSimilar = (event) => {
    event.stopPropagation();
    if (onClick) {
      onClick(book);
    }
  };

  const handleExternalLink = (event, url) => {
    event.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isbn = cleanIsbn(book.isbn);
  const isbn13 = cleanIsbn(book.isbn13);

  const bookwyrmUrl = resolveBookwyrmUrl(book);

  const amazonUrl = isbn
    ? `https://www.amazon.com/dp/${isbn}`
    : isbn13
      ? `https://www.amazon.com/s?k=${isbn13}`
      : `https://www.amazon.com/s?k=${encodeURIComponent(`${book.title} ${book.author} book`)}`;

  const matchReason =
    mode === 'similar' ? buildSimilarityReason(book.id) : buildReason(query, book.id);

  const activity = book.activity;
  const latestActivity = Array.isArray(activity?.entries) ? activity.entries[0] : null;
  const latestActivityDate =
    latestActivity?.publishedAt && typeof latestActivity.publishedAt === 'string'
      ? new Date(latestActivity.publishedAt)
      : null;
  const latestActivityDisplay =
    latestActivityDate && !Number.isNaN(latestActivityDate.valueOf())
      ? latestActivityDate.toLocaleDateString()
      : latestActivity?.publishedAt ?? null;
  const latestActivityType = latestActivity?.type
    ? `${latestActivity.type.charAt(0).toUpperCase()}${latestActivity.type.slice(1)}`
    : null;
  const personalAverageRating =
    typeof activity?.averageRating === 'number' && Number.isFinite(activity.averageRating)
      ? activity.averageRating
      : null;
  const personalRatingsCount = activity?.ratingsCount ?? 0;

  return (
    <div className="book-item" onClick={onClick ? () => onClick(book) : undefined}>
      <div className="book-item-content">
        <div className="book-header">
          <div className="book-main-info">
            <h3 className="book-title">{book.title}</h3>
            <p className="book-author">by {book.author}</p>
          </div>

          {typeof book.similarity === 'number' && (
            <div className="match-badge">
              <span className="match-percentage">{Math.round(book.similarity * 100)}%</span>
            </div>
          )}
        </div>

        {book.shelfLabel && (
          <span className="book-shelf-tag">{book.shelfLabel}</span>
        )}

        {typeof book.average_rating === 'number' && (
          <div className="book-rating">
            <span className="stars">{'★'.repeat(Math.round(book.average_rating))}</span>
            <span className="rating-value">{Number(book.average_rating).toFixed(1)}</span>
          </div>
        )}

        {typeof book.similarity === 'number' && (
          <div className="match-container">
            <p className="match-reason">{matchReason}</p>
          </div>
        )}

        {activity && (
          <div className="book-activity">
            {personalAverageRating !== null && personalRatingsCount > 0 && (
              <div className="book-activity-rating">
                <span className="label">Your avg rating</span>
                <span className="value">
                  {personalAverageRating.toFixed(2)}
                  {activity.ratingScaleMax ? ` / ${activity.ratingScaleMax}` : ''}
                </span>
              </div>
            )}
            {latestActivity && (
              <div className="book-activity-entry">
                <div className="meta">
                  {latestActivityType && <span className="type">{latestActivityType}</span>}
                  {latestActivityDisplay && <span className="date">{latestActivityDisplay}</span>}
                  {latestActivity.rating != null && (
                    <span className="rating">
                      {Number(latestActivity.rating).toFixed(1)}
                      {latestActivity.ratingScaleMax ? `/${latestActivity.ratingScaleMax}` : ''}
                    </span>
                  )}
                </div>
                {latestActivity.content && (
                  <p className="summary">{latestActivity.content}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="book-actions">
          {onClick && (
            <button
              type="button"
              className="action-button find-similar-button"
              onClick={handleFindSimilar}
              title="Find similar books"
            >
              Find Similar
            </button>
          )}

          <div className="book-external-links">
            {bookwyrmUrl && (
              <button
                type="button"
                className="external-link bookwyrm-link"
                onClick={(event) => handleExternalLink(event, bookwyrmUrl)}
              >
                Bookwyrm
              </button>
            )}
            <button
              type="button"
              className="external-link amazon-link"
              onClick={(event) => handleExternalLink(event, amazonUrl)}
            >
              Amazon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
