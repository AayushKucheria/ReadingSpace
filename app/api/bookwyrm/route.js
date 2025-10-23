import { NextResponse } from 'next/server';
import { importBookwyrmShelves } from '@/lib/server/bookwyrm';

function sanitizeShelf(slug) {
  if (!slug || typeof slug !== 'string') {
    return null;
  }
  return slug.trim().toLowerCase();
}

function sanitizeShelfState(input) {
  if (!input || typeof input !== 'object') {
    return {};
  }

  return Object.entries(input).reduce((acc, [key, value]) => {
    const slug = sanitizeShelf(key);
    if (!slug || !value || typeof value !== 'object') {
      return acc;
    }
    const sanitized = {};
    if (typeof value.etag === 'string') {
      sanitized.etag = value.etag;
    }
    if (typeof value.lastModified === 'string') {
      sanitized.lastModified = value.lastModified;
    }
    if (Object.keys(sanitized).length > 0) {
      acc[slug] = sanitized;
    }
    return acc;
  }, {});
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const { instanceDomain, username, shelves, shelfState } = payload ?? {};

  if (!instanceDomain || typeof instanceDomain !== 'string') {
    return NextResponse.json({ error: 'instanceDomain is required.' }, { status: 400 });
  }

  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'username is required.' }, { status: 400 });
  }

  const sanitizedShelves = Array.isArray(shelves)
    ? shelves.map(sanitizeShelf).filter(Boolean)
    : [];

  if (sanitizedShelves.length === 0) {
    return NextResponse.json(
      { error: 'Provide at least one shelf to import.' },
      { status: 400 }
    );
  }

  try {
    const result = await importBookwyrmShelves({
      instanceDomain,
      username,
      shelves: sanitizedShelves,
      shelfState: sanitizeShelfState(shelfState)
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to import from Bookwyrm', error);
    return NextResponse.json(
      {
        error:
          error.message ??
          'Failed to import Bookwyrm shelves. Ensure the user and shelf are public.'
      },
      { status: 502 }
    );
  }
}
