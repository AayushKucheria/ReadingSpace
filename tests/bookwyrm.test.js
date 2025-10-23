import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importBookwyrmShelves } from '../lib/server/bookwyrm.js';

process.on('uncaughtException', (error) => {
  console.error(error);
});

process.on('unhandledRejection', (reason) => {
  console.error(reason);
});

const INSTANCE = 'bookwyrm.test';
const USERNAME = 'tester';

function buildEdition(id, extra = {}) {
  return {
    id,
    title: `Edition ${id}`,
    authors: [{ name: 'Author One' }],
    description: '<p>An adventure tale.</p>',
    subjects: ['Adventure', 'Fantasy'],
    ...extra
  };
}

function jsonResponse(payload, init = {}) {
  const { headers: customHeaders = {}, ...rest } = init;
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/activity+json',
      ...customHeaders
    },
    ...rest
  });
}

test('importBookwyrmShelves merges paginated shelves and dedupes editions', async () => {
  const originalFetch = global.fetch;

  const editionOne = buildEdition(`https://${INSTANCE}/book/edition/1`);
  const editionTwo = buildEdition(`https://${INSTANCE}/book/edition/2`);

  global.fetch = async (url) => {
    if (url === `https://${INSTANCE}/user/${USERNAME}/shelf/to-read.json`) {
      return jsonResponse({
        first: `https://${INSTANCE}/user/${USERNAME}/shelf/to-read/page/1`
      }, { headers: { ETag: '"etag-123"' } });
    }

    if (url === `https://${INSTANCE}/user/${USERNAME}/shelf/to-read/page/1.json`) {
      return jsonResponse({
        orderedItems: [
          { id: editionOne.id },
          { id: editionTwo.id }
        ],
        next: `https://${INSTANCE}/user/${USERNAME}/shelf/to-read/page/2`
      });
    }

    if (url === `https://${INSTANCE}/user/${USERNAME}/shelf/to-read/page/2.json`) {
      return jsonResponse({
        orderedItems: [{ id: editionTwo.id }],
        next: null
      });
    }

    if (url === `${editionOne.id}.json`) {
      return jsonResponse(editionOne);
    }

    if (url === `${editionTwo.id}.json`) {
      return jsonResponse(editionTwo);
    }

    if (url === `https://${INSTANCE}/user/${USERNAME}/outbox.json`) {
      return jsonResponse({ first: null });
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const result = await importBookwyrmShelves({
      instanceDomain: INSTANCE,
      username: USERNAME,
      shelves: ['to-read']
    });

    assert.equal(result.books.length, 2, 'should dedupe duplicate editions');
    assert.equal(result.shelfStates['to-read'].status, 'updated');
    result.books.forEach((book) => {
      assert.equal(typeof book.embeddingHash, 'string');
      assert.ok(book.embeddingHash.length > 0);
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('importBookwyrmShelves skips unchanged shelf when ETag matches', async () => {
  const originalFetch = global.fetch;

  let lastHeaders;

  global.fetch = async (url, options = {}) => {
    if (url === `https://${INSTANCE}/user/${USERNAME}/shelf/read.json`) {
      lastHeaders = options.headers;
      return new Response(null, {
        status: 304,
        headers: new Headers({ ETag: '"etag-existing"' })
      });
    }

    if (url === `https://${INSTANCE}/user/${USERNAME}/outbox.json`) {
      return jsonResponse({ first: null });
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const result = await importBookwyrmShelves({
      instanceDomain: INSTANCE,
      username: USERNAME,
      shelves: ['read'],
      shelfState: {
        read: {
          etag: '"etag-existing"'
        }
      }
    });

    assert.ok(lastHeaders['If-None-Match']);
    assert.equal(result.books.length, 0);
    assert.equal(result.shelfStates.read.status, 'not-modified');
  } finally {
    global.fetch = originalFetch;
  }
});

test('activity feed updates influence embedding hash', async () => {
  const originalFetch = global.fetch;

  const edition = buildEdition(`https://${INSTANCE}/book/edition/10`);

  let activityEntries = [];

  global.fetch = async (url) => {
    if (url === `https://${INSTANCE}/user/${USERNAME}/shelf/favorites.json`) {
      return jsonResponse({
        first: `https://${INSTANCE}/user/${USERNAME}/shelf/favorites/page/1`
      }, { headers: { ETag: '"fav-etag"' } });
    }

    if (url === `https://${INSTANCE}/user/${USERNAME}/shelf/favorites/page/1.json`) {
      return jsonResponse({
        orderedItems: [{ id: edition.id }],
        next: null
      });
    }

    if (url === `${edition.id}.json`) {
      return jsonResponse(edition);
    }

    if (url === `https://${INSTANCE}/user/${USERNAME}/outbox.json`) {
      return jsonResponse({ first: `https://${INSTANCE}/user/${USERNAME}/outbox/page/1` });
    }

    if (url === `https://${INSTANCE}/user/${USERNAME}/outbox/page/1.json`) {
      return jsonResponse({ orderedItems: activityEntries, next: null });
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    activityEntries = [];
    const initial = await importBookwyrmShelves({
      instanceDomain: INSTANCE,
      username: USERNAME,
      shelves: ['favorites']
    });

    const bookId = initial.books[0].id;
    const initialHash = initial.books[0].embeddingHash;

    activityEntries = [
      {
        type: 'Create',
        object: {
          type: 'Review',
          id: `https://${INSTANCE}/review/1`,
          inReplyToBook: { id: edition.id },
          content: '<p>A moving and unforgettable story.</p>',
          rating: { value: 5, scaleMax: 5 }
        },
        published: '2024-01-01T00:00:00Z'
      }
    ];

    const withActivity = await importBookwyrmShelves({
      instanceDomain: INSTANCE,
      username: USERNAME,
      shelves: ['favorites']
    });

    const updated = withActivity.books.find((book) => book.id === bookId);
    assert.ok(updated, 'expected to find same edition after activity change');
    assert.notEqual(updated.embeddingHash, initialHash, 'hash should change when activity text changes');
    assert.ok(Array.isArray(updated.activity.entries));
    assert.equal(updated.activity.entries.length, 1);
  } finally {
    global.fetch = originalFetch;
  }
});
