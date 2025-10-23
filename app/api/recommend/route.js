import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const MODEL = process.env.OPENAI_RECOMMENDATION_MODEL ?? 'gpt-4o-mini';

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Add it to your environment variables.');
  }
  return new OpenAI({ apiKey });
}

function buildBookContext(book) {
  const lines = [
    `Title: ${book.title ?? 'Unknown Title'}`,
    book.author ? `Author: ${book.author}` : null,
    book.shelfLabel ? `Shelf: ${book.shelfLabel}` : null
  ];

  if (Array.isArray(book.subjects) && book.subjects.length > 0) {
    lines.push(`Subjects: ${book.subjects.join(', ')}`);
  }

  if (book.description) {
    lines.push(`Description: ${book.description}`);
  }

  const activity = book.activity;
  if (activity) {
    if (typeof activity.averageRating === 'number' && activity.ratingsCount > 0) {
      lines.push(
        `Personal average rating: ${activity.averageRating.toFixed(2)} / ${activity.ratingScaleMax ?? 5} (${activity.ratingsCount} ratings).`
      );
    }
    if (Array.isArray(activity.entries) && activity.entries.length > 0) {
      const entry = activity.entries[0];
      const fragments = [];
      if (entry.type) {
        fragments.push(`Latest entry type: ${entry.type}.`);
      }
      if (entry.rating != null) {
        const max = entry.ratingScaleMax ? `/${entry.ratingScaleMax}` : '';
        fragments.push(`Latest rating: ${Number(entry.rating).toFixed(1)}${max}.`);
      }
      if (entry.content) {
        fragments.push(`Latest note: ${entry.content}`);
      }
      if (fragments.length > 0) {
        lines.push(fragments.join(' '));
      }
    }
  }

  return lines.filter(Boolean).join('\n');
}

function buildPrompt(query, book) {
  return [
    'User concept:',
    query,
    '',
    'Candidate book details:',
    buildBookContext(book),
    '',
    'Produce a concise, enthusiastic recommendation (2 sentences maximum) explaining why this book matches the user concept and referencing any personal activity when relevant.'
  ].join('\n');
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const query = typeof payload?.query === 'string' ? payload.query.trim() : '';
  const book = payload?.book;

  if (!query) {
    return NextResponse.json({ error: 'query is required.' }, { status: 400 });
  }

  if (!book || typeof book !== 'object') {
    return NextResponse.json({ error: 'book is required.' }, { status: 400 });
  }

  let client;
  try {
    client = getClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 220,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful reading guide. Recommend books clearly and concisely, focusing on how the book aligns with the user concept.'
        },
        {
          role: 'user',
          content: buildPrompt(query, book)
        }
      ]
    });

    const message = response.choices?.[0]?.message?.content ?? '';
    const summary = typeof message === 'string' ? message.trim() : '';

    if (!summary) {
      throw new Error('Empty response from language model.');
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Failed to create recommendation summary', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendation summary.' },
      { status: 500 }
    );
  }
}
