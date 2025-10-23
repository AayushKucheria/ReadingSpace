import { createHash } from 'node:crypto';
import { buildEmbeddingInput } from '../books.js';

const ACTIVITY_STREAMS_ACCEPT =
  'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"';

function cleanUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  return url.trim();
}

function toAbsoluteUrl(instanceDomain, url) {
  const cleaned = cleanUrl(url);
  if (!cleaned) {
    return null;
  }
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }
  return `https://${instanceDomain.replace(/\/$/, '')}/${cleaned.replace(/^\//, '')}`;
}

function ensureJsonUrl(url) {
  const cleaned = cleanUrl(url);
  if (!cleaned) {
    return null;
  }
  if (cleaned.includes('.json')) {
    return cleaned;
  }

  const [base, query] = cleaned.split('?');
  const withJson = `${base}.json`;
  return query ? `${withJson}?${query}` : withJson;
}

async function fetchActivityResource(url, options = {}) {
  const { headers: customHeaders = {}, allowedStatus = [] } = options ?? {};
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: ACTIVITY_STREAMS_ACCEPT,
      ...customHeaders
    },
    next: { revalidate: 0 }
  });

  if (response.status === 304) {
    return {
      status: 304,
      headers: response.headers,
      json: null
    };
  }

  if (allowedStatus.includes(response.status)) {
    return {
      status: response.status,
      headers: response.headers,
      json: null
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(
      `Bookwyrm request failed (${response.status} ${response.statusText}) for ${url}${
        text ? ` – ${text.slice(0, 200)}` : ''
      }`
    );
  }

  const json = await response.json();
  return {
    status: response.status,
    headers: response.headers,
    json
  };
}

async function fetchJson(url, options = {}) {
  const result = await fetchActivityResource(url, options);
  if (result.status === 304) {
    throw new Error(`Received 304 Not Modified for JSON request: ${url}`);
  }
  return result.json;
}

function unwrapFirstLink(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    if (value.id) {
      return value.id;
    }
    if (value.href) {
      return value.href;
    }
    if (Array.isArray(value) && value.length > 0) {
      return unwrapFirstLink(value[0]);
    }
  }

  return null;
}

function normalizeDescription(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    if (typeof value.content === 'string') {
      return value.content;
    }
    if (typeof value.summary === 'string') {
      return value.summary;
    }
    if (typeof value.value === 'string') {
      return value.value;
    }
  }

  return null;
}

function stripHtml(value) {
  if (!value) {
    return '';
  }
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractIsbn(edition, keys) {
  for (const key of keys) {
    if (edition[key]) {
      const raw = String(edition[key]).trim();
      if (raw) {
        return raw;
      }
    }
  }
  return null;
}

function extractAuthorNames(edition) {
  const authors = edition?.authors;
  if (!Array.isArray(authors) || authors.length === 0) {
    return [];
  }

  return authors
    .map((author) => {
      if (!author) {
        return null;
      }
      if (typeof author === 'string') {
        return author;
      }
      if (typeof author.name === 'string') {
        return author.name;
      }
      if (typeof author.preferredName === 'string') {
        return author.preferredName;
      }
      return null;
    })
    .filter((name) => name && name.trim())
    .map((name) => name.trim());
}

function extractSubjects(edition) {
  const subjects = edition?.subjects ?? edition?.tags;
  if (Array.isArray(subjects)) {
    return subjects
      .map((subject) => {
        if (typeof subject === 'string') {
          return subject;
        }
        if (subject && typeof subject.name === 'string') {
          return subject.name;
        }
        return null;
      })
      .filter(Boolean)
      .map((subject) => subject.trim())
      .filter(Boolean);
  }
  return [];
}

function computeEmbeddingHash(input) {
  const normalized = typeof input === 'string' ? input : '';
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

function truncateText(value, length = 600) {
  if (!value) {
    return '';
  }
  const trimmed = String(value).trim();
  if (trimmed.length <= length) {
    return trimmed;
  }
  return `${trimmed.slice(0, length)}...`;
}

function normalizeActivityEditionId(instanceDomain, value) {
  const link = unwrapFirstLink(value);
  if (!link) {
    return null;
  }
  const absolute = toAbsoluteUrl(instanceDomain, link);
  return ensureJsonUrl(absolute);
}

function extractRatingInfo(object) {
  if (!object) {
    return null;
  }

  const ratingCandidate = object.rating ?? object.reviewRating ?? object.review_rating;

  if (ratingCandidate == null) {
    if (typeof object.score === 'number') {
      return {
        value: object.score,
        scaleMax: 5,
        scaleMin: 0
      };
    }
    return null;
  }

  if (typeof ratingCandidate === 'number') {
    return {
      value: ratingCandidate,
      scaleMax: 5,
      scaleMin: 0
    };
  }

  const value = Number(ratingCandidate.value ?? ratingCandidate.rating ?? ratingCandidate.score);
  if (!Number.isFinite(value)) {
    return null;
  }

  const scaleMax = Number(
    ratingCandidate.scaleMax ??
      ratingCandidate.max ??
      (ratingCandidate.bestRating ? ratingCandidate.bestRating : 5)
  );
  const scaleMin = Number(
    ratingCandidate.scaleMin ??
      ratingCandidate.min ??
      (ratingCandidate.worstRating ? ratingCandidate.worstRating : 0)
  );

  return {
    value,
    scaleMax: Number.isFinite(scaleMax) ? scaleMax : 5,
    scaleMin: Number.isFinite(scaleMin) ? scaleMin : 0
  };
}

function extractPublishedAt(activity, object) {
  return (
    object?.published ??
    object?.updated ??
    activity?.published ??
    activity?.updated ??
    null
  );
}

function buildActivityEntry(activity, instanceDomain) {
  if (!activity) {
    return null;
  }

  const object = activity.object ?? activity;
  const objectType = (object?.type ?? '').toLowerCase();
  if (!object) {
    return null;
  }

  const editionId =
    normalizeActivityEditionId(instanceDomain, object.inReplyToBook) ??
    normalizeActivityEditionId(instanceDomain, object.book) ??
    normalizeActivityEditionId(instanceDomain, object.inReplyTo);

  if (!editionId) {
    return null;
  }

  const content = truncateText(stripHtml(object.content ?? object.summary ?? object.name ?? ''));
  const ratingInfo = extractRatingInfo(object);

  if (!content && !ratingInfo) {
    return null;
  }

  const publishedAt = extractPublishedAt(activity, object);
  const activityId = cleanUrl(object.id ?? activity.id ?? null);
  const entry = {
    id: activityId ? ensureJsonUrl(activityId) : null,
    type: objectType || 'note',
    publishedAt: publishedAt ?? null,
    content: content || null,
    rating: ratingInfo ? ratingInfo.value : null,
    ratingScaleMax: ratingInfo ? ratingInfo.scaleMax : null,
    ratingScaleMin: ratingInfo ? ratingInfo.scaleMin : null,
    url: cleanUrl(object.url ?? activity.url ?? activityId)
  };

  return {
    editionId,
    entry
  };
}

async function iterateActivityCollection(instanceDomain, firstLink, fetchOptions = {}, limit = 200) {
  const results = [];
  let nextUrl = ensureJsonUrl(toAbsoluteUrl(instanceDomain, firstLink));
  const visited = new Set();

  while (nextUrl && !visited.has(nextUrl) && results.length < limit) {
    visited.add(nextUrl);
    const pageResult = await fetchActivityResource(nextUrl, fetchOptions);
    if (pageResult.status === 304) {
      break;
    }
    const page = pageResult.json;
    const items = Array.isArray(page?.orderedItems)
      ? page.orderedItems
      : Array.isArray(page?.items)
        ? page.items
        : [];

    for (const item of items) {
      results.push(item);
      if (results.length >= limit) {
        break;
      }
    }

    const nextLink = unwrapFirstLink(page?.next);
    nextUrl = nextLink ? ensureJsonUrl(toAbsoluteUrl(instanceDomain, nextLink)) : null;
  }

  return results;
}

async function fetchUserActivity(instanceDomain, username, fetchOptions = {}) {
  try {
    const outboxUrl = `https://${instanceDomain}/user/${encodeURIComponent(
      username
    )}/outbox.json`;
    const outboxResponse = await fetchActivityResource(outboxUrl, {
      headers: fetchOptions.headers,
      allowedStatus: [404]
    });

    if (outboxResponse.status === 404 || !outboxResponse.json) {
      return new Map();
    }

    const outbox = outboxResponse.json;
    const firstLink = unwrapFirstLink(outbox?.first);
    if (!firstLink) {
      return new Map();
    }

    const activities = await iterateActivityCollection(
      instanceDomain,
      firstLink,
      fetchOptions
    );
    const aggregated = new Map();

    activities.forEach((activity) => {
      const built = buildActivityEntry(activity, instanceDomain);
      if (!built) {
        return;
      }

      const { editionId, entry } = built;
      const record = aggregated.get(editionId) ?? {
        entries: [],
        lastActivityAt: null,
        ratingsCount: 0,
        ratingsTotal: 0,
        reviewCount: 0,
        ratingScaleMax: 5,
        ratingScaleMin: 0
      };

      record.entries.push(entry);

      if (entry.rating != null) {
        record.ratingsCount += 1;
        record.ratingsTotal += entry.rating;
        if (entry.ratingScaleMax != null) {
          record.ratingScaleMax = entry.ratingScaleMax;
        }
        if (entry.ratingScaleMin != null) {
          record.ratingScaleMin = entry.ratingScaleMin;
        }
      }

      if (entry.type === 'review' && entry.content) {
        record.reviewCount += 1;
      }

      if (!record.lastActivityAt || (entry.publishedAt && entry.publishedAt > record.lastActivityAt)) {
        record.lastActivityAt = entry.publishedAt;
      }

      aggregated.set(editionId, record);
    });

    aggregated.forEach((record, key) => {
      record.entries.sort((a, b) => {
        if (!a.publishedAt && !b.publishedAt) {
          return 0;
        }
        if (!a.publishedAt) {
          return 1;
        }
        if (!b.publishedAt) {
          return -1;
        }
        return b.publishedAt.localeCompare(a.publishedAt);
      });

      if (record.entries.length > 3) {
        record.entries = record.entries.slice(0, 3);
      }

      if (record.ratingsCount > 0) {
        record.averageRating = Number(
          (record.ratingsTotal / record.ratingsCount).toFixed(2)
        );
      } else {
        record.averageRating = null;
      }
    });

    return aggregated;
  } catch (error) {
    console.warn('Failed to load user outbox activity', error);
    return new Map();
  }
}
function dedupeById(items) {
  const map = new Map();
  items.forEach((item) => {
    if (!item?.id) {
      return;
    }
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

async function ensureEdition(
  instanceDomain,
  entry,
  cache,
  fetchOptions = {}
) {
  if (!entry) {
    return null;
  }

  if (typeof entry === 'string') {
    return fetchEdition(instanceDomain, entry, cache, fetchOptions);
  }

  if (entry.object) {
    return ensureEdition(instanceDomain, entry.object, cache, fetchOptions);
  }

  if (entry.type === 'Edition') {
    if (entry.id) {
      cache.set(entry.id, entry);
    }
    return entry;
  }

  if (entry.type === 'Work') {
    const preferred =
      unwrapFirstLink(entry.preferredEdition) ??
      unwrapFirstLink(entry.default_edition) ??
      unwrapFirstLink(entry.defaultEdition);
    if (preferred) {
      return fetchEdition(instanceDomain, preferred, cache, fetchOptions);
    }
  }

  if (entry.id) {
    return fetchEdition(instanceDomain, entry.id, cache, fetchOptions);
  }

  return null;
}

async function fetchEdition(instanceDomain, id, cache, fetchOptions = {}) {
  const editionId = cleanUrl(id);
  if (!editionId) {
    return null;
  }

  if (cache.has(editionId)) {
    return cache.get(editionId);
  }

  const absolute = toAbsoluteUrl(instanceDomain, editionId);
  const url = ensureJsonUrl(absolute);
  const edition = await fetchJson(url, fetchOptions);
  if (edition?.id) {
    cache.set(edition.id, edition);
  }
  return edition;
}

async function iterateOrderedCollectionPages(
  instanceDomain,
  firstLink,
  cache,
  fetchOptions = {}
) {
  const results = [];
  let nextUrl = ensureJsonUrl(toAbsoluteUrl(instanceDomain, firstLink));
  const visited = new Set();

  while (nextUrl && !visited.has(nextUrl)) {
    visited.add(nextUrl);
    const page = await fetchJson(nextUrl, fetchOptions);
    const items = Array.isArray(page?.orderedItems)
      ? page.orderedItems
      : Array.isArray(page?.items)
        ? page.items
        : [];

    for (const item of items) {
      const edition = await ensureEdition(instanceDomain, item, cache, fetchOptions);
      if (edition) {
        results.push(edition);
      }
    }

    const nextLink = unwrapFirstLink(page?.next);
    nextUrl = nextLink ? ensureJsonUrl(toAbsoluteUrl(instanceDomain, nextLink)) : null;
  }

  return results;
}

function normalizeEdition(edition, shelf, instanceDomain) {
  if (!edition) {
    return null;
  }

  const description = stripHtml(normalizeDescription(edition.description ?? edition.summary));
  const subjects = extractSubjects(edition);
  const authors = extractAuthorNames(edition);
  const firstAuthor = authors[0] ?? 'Unknown Author';

  return {
    id: edition.id ?? `${shelf.slug}:${Math.random().toString(36).slice(2)}`,
    title: edition.title ?? edition.name ?? 'Untitled',
    subtitle: edition.subtitle ?? null,
    author: firstAuthor,
    authors,
    shelf: shelf.slug,
    shelfLabel: shelf.name ?? shelf.slug,
    isbn: extractIsbn(edition, ['isbn', 'isbn_10', 'isbn10']),
    isbn13: extractIsbn(edition, ['isbn_13', 'isbn13']),
    coverUrl: edition.cover?.url ?? edition.cover,
    description,
    subjects,
    publishedDate:
      edition.published_date ??
      edition.publishedDate ??
      edition.first_published_date ??
      edition.firstPublishedDate ??
      null,
    workId: unwrapFirstLink(edition.work),
    activityUrl: edition.id ? ensureJsonUrl(edition.id) : null,
    url: edition.id ? cleanUrl(edition.id) : null,
    instanceDomain
  };
}

export async function importBookwyrmShelves(options) {
  const { instanceDomain, username, shelves } = options ?? {};

  if (!instanceDomain || typeof instanceDomain !== 'string') {
    throw new Error('instanceDomain is required.');
  }
  if (!username || typeof username !== 'string') {
    throw new Error('username is required.');
  }
  if (!Array.isArray(shelves) || shelves.length === 0) {
    throw new Error('At least one shelf must be provided.');
  }

  const fetchOptions = { headers: options?.headers ?? {} };
  const normalizedInstance = instanceDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const editionCache = new Map();
  const collectedBooks = [];
  const shelfStates = {};
  const previousShelfState =
    options && typeof options === 'object' && options.shelfState && typeof options.shelfState === 'object'
      ? options.shelfState
      : {};
  const syncTimestamp = new Date().toISOString();
  const activityPromise = fetchUserActivity(normalizedInstance, username, fetchOptions);

  for (const shelfSlug of shelves) {
    if (!shelfSlug || typeof shelfSlug !== 'string') {
      continue;
    }

    const priorState =
      previousShelfState && typeof previousShelfState[shelfSlug] === 'object'
        ? previousShelfState[shelfSlug]
        : {};

    const shelfUrl = `https://${normalizedInstance}/user/${encodeURIComponent(
      username
    )}/shelf/${encodeURIComponent(shelfSlug)}.json`;

    const headers = { ...fetchOptions.headers };
    if (priorState?.etag) {
      headers['If-None-Match'] = priorState.etag;
    }
    if (priorState?.lastModified) {
      headers['If-Modified-Since'] = priorState.lastModified;
    }

    const shelfResponse = await fetchActivityResource(shelfUrl, { headers });
    const responseEtag = shelfResponse.headers?.get('etag')?.trim() ?? null;
    const responseLastModified = shelfResponse.headers?.get('last-modified')?.trim() ?? null;
    const shelfName = shelfResponse.json?.name ?? priorState?.name ?? shelfSlug;
    const resolvedEtag = responseEtag ?? priorState?.etag ?? null;
    const resolvedLastModified = responseLastModified ?? priorState?.lastModified ?? null;

    if (shelfResponse.status === 304) {
      shelfStates[shelfSlug] = {
        status: 'not-modified',
        etag: resolvedEtag,
        lastModified: resolvedLastModified,
        itemCount: priorState?.itemCount ?? 0,
        name: shelfName,
        checkedAt: syncTimestamp
      };
      continue;
    }

    const shelfData = shelfResponse.json;
    const firstLink = unwrapFirstLink(shelfData?.first);

    if (!firstLink) {
      shelfStates[shelfSlug] = {
        status: 'updated',
        etag: resolvedEtag,
        lastModified: resolvedLastModified,
        itemCount: 0,
        name: shelfName,
        checkedAt: syncTimestamp
      };
      continue;
    }

    const editions = await iterateOrderedCollectionPages(
      normalizedInstance,
      firstLink,
      editionCache,
      fetchOptions
    );

    const shelfInfo = {
      slug: shelfSlug,
      name: shelfName
    };

    editions.forEach((edition) => {
      const book = normalizeEdition(edition, shelfInfo, normalizedInstance);
      if (book) {
        collectedBooks.push(book);
      }
    });

    shelfStates[shelfSlug] = {
      status: 'updated',
      etag: resolvedEtag,
      lastModified: resolvedLastModified,
      itemCount: editions.length,
      name: shelfName,
      checkedAt: syncTimestamp
    };
  }

  const dedupedBooks = dedupeById(collectedBooks);
  const activityByEditionRaw = await activityPromise;
  const sanitizedActivityMap = new Map();
  const activityByBook = {};

  activityByEditionRaw.forEach((record, key) => {
    const entries = Array.isArray(record.entries) ? record.entries : [];
    const sanitizedEntries = entries.map((entry) => ({
      id: entry?.id ?? null,
      type: entry?.type ?? 'note',
      publishedAt: entry?.publishedAt ?? null,
      content: entry?.content ?? null,
      rating: entry?.rating ?? null,
      ratingScaleMax: entry?.ratingScaleMax ?? null,
      ratingScaleMin: entry?.ratingScaleMin ?? null,
      url: cleanUrl(entry?.url ?? entry?.id ?? null)
    }));

    const sanitizedRecord = {
      entries: sanitizedEntries,
      lastActivityAt: record.lastActivityAt ?? null,
      ratingsCount: record.ratingsCount ?? 0,
      reviewCount: record.reviewCount ?? 0,
      averageRating: record.averageRating ?? null,
      ratingScaleMax: record.ratingScaleMax ?? 5,
      ratingScaleMin: record.ratingScaleMin ?? 0
    };

    sanitizedActivityMap.set(key, sanitizedRecord);
    activityByBook[key] = sanitizedRecord;
  });

  const booksWithEmbeddingData = dedupedBooks.map((book) => {
    const candidates = [
      book.activityUrl,
      book.id ? ensureJsonUrl(book.id) : null
    ].filter(Boolean);
    const activityRecord = candidates
      .map((candidate) => sanitizedActivityMap.get(candidate))
      .find(Boolean);

    const bookWithActivity = activityRecord
      ? { ...book, activity: activityRecord }
      : book;

    const embeddingInput = buildEmbeddingInput(bookWithActivity);
    return {
      ...bookWithActivity,
      embeddingInput,
      embeddingHash: computeEmbeddingHash(embeddingInput)
    };
  });

  return {
    books: booksWithEmbeddingData,
    shelfStates,
    activityByBook
  };
}
