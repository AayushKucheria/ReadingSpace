export function buildEmbeddingInput(book) {
  if (!book) {
    return '';
  }

  const lines = [];
  const title = book.title ?? book.name ?? 'Untitled';
  lines.push(`Title: ${title}.`);

  if (book.subtitle) {
    lines.push(`Subtitle: ${book.subtitle}.`);
  }

  if (book.author) {
    lines.push(`Author: ${book.author}.`);
  }

  if (Array.isArray(book.authors) && book.authors.length > 1) {
    lines.push(`Contributing authors: ${book.authors.join(', ')}.`);
  }

  if (book.shelfLabel) {
    lines.push(`Shelf: ${book.shelfLabel}.`);
  }

  if (book.publishedDate) {
    lines.push(`Publication date: ${book.publishedDate}.`);
  }

  if (book.isbn) {
    lines.push(`ISBN: ${book.isbn}.`);
  }

  if (book.isbn13) {
    lines.push(`ISBN-13: ${book.isbn13}.`);
  }

  if (Array.isArray(book.subjects) && book.subjects.length > 0) {
    lines.push(`Subjects: ${book.subjects.join(', ')}.`);
  }

  if (book.description) {
    lines.push(`Description: ${book.description}`);
  }

  const activity = book.activity;

  if (activity) {
    if (
      typeof activity.averageRating === 'number' &&
      Number.isFinite(activity.averageRating) &&
      activity.ratingsCount > 0
    ) {
      const scaleMax =
        typeof activity.ratingScaleMax === 'number' && Number.isFinite(activity.ratingScaleMax)
          ? activity.ratingScaleMax
          : 5;
      lines.push(
        `Personal average rating: ${activity.averageRating.toFixed(
          2
        )} out of ${scaleMax}. (${activity.ratingsCount} rating${activity.ratingsCount === 1 ? '' : 's'} recorded.)`
      );
    }

    if (Array.isArray(activity.entries) && activity.entries.length > 0) {
      lines.push('Recent personal activity:');
      activity.entries.slice(0, 3).forEach((entry) => {
        if (!entry) {
          return;
        }

        const fragments = [];

        if (entry.rating != null) {
          const scaleMax =
            typeof entry.ratingScaleMax === 'number' && Number.isFinite(entry.ratingScaleMax)
              ? entry.ratingScaleMax
              : null;
          fragments.push(
            `Rating: ${Number(entry.rating).toFixed(1)}${scaleMax ? `/${Number(scaleMax).toFixed(1)}` : ''}.`
          );
        }

        if (entry.content) {
          fragments.push(entry.content);
        }

        if (entry.publishedAt) {
          fragments.push(`Logged on ${entry.publishedAt}.`);
        }

        if (fragments.length > 0) {
          lines.push(fragments.join(' '));
        }
      });
    }
  }

  return lines.filter(Boolean).join('\n');
}
