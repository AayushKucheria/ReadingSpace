import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
const CHUNK_SIZE = Number.parseInt(process.env.EMBED_BATCH_SIZE ?? '32', 10);

function getClient(apiKey) {
  const sanitized = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!sanitized) {
    throw new Error('OpenAI API key is required.');
  }
  return new OpenAI({ apiKey: sanitized });
}

async function createEmbeddings(client, inputs) {
  const embeddings = [];

  for (let i = 0; i < inputs.length; i += CHUNK_SIZE) {
    const batch = inputs.slice(i, i + CHUNK_SIZE);
    const response = await client.embeddings.create({
      model: MODEL,
      input: batch
    });

    response.data.forEach((item) => {
      embeddings.push(item.embedding);
    });
  }

  return embeddings;
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const { inputs, apiKey } = payload ?? {};

  if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
    return NextResponse.json(
      { error: 'Request body must include a non-empty "inputs" array.' },
      { status: 400 }
    );
  }

  const sanitizedKey = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!sanitizedKey) {
    return NextResponse.json(
      { error: 'Request body must include an "apiKey" string.' },
      { status: 400 }
    );
  }

  let sanitizedInputs;
  try {
    sanitizedInputs = inputs.map((input) => {
      if (typeof input !== 'string') {
        throw new Error('All inputs must be strings.');
      }
      return input.slice(0, 4096);
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let client;
  try {
    client = getClient(sanitizedKey);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    const embeddings = await createEmbeddings(client, sanitizedInputs);
    return NextResponse.json({ embeddings });
  } catch (error) {
    console.error('Failed to create embeddings', error);
    return NextResponse.json(
      { error: 'Failed to generate embeddings. Check server logs for details.' },
      { status: 500 }
    );
  }
}
