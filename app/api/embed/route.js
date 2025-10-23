import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
const CHUNK_SIZE = Number.parseInt(process.env.EMBED_BATCH_SIZE ?? '32', 10);

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Add it to your environment variables.'
    );
  }
  return new OpenAI({ apiKey });
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

  const { inputs } = payload ?? {};

  if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
    return NextResponse.json(
      { error: 'Request body must include a non-empty "inputs" array.' },
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
    client = getClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
