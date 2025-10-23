'use client';

/**
 * Compute cosine similarity between two embedding vectors.
 */
export function cosineSimilarity(vectorA, vectorB) {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
    throw new Error('Both inputs must be arrays.');
  }

  if (vectorA.length !== vectorB.length) {
    throw new Error('Embedding vectors must have the same length.');
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i += 1) {
    const a = vectorA[i];
    const b = vectorB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Rank candidate items by cosine similarity.
 */
export function rankBySimilarity(targetVector, candidates, opts = {}) {
  const { limit = 10, transform = (item) => item } = opts;

  return candidates
    .map((item) => {
      const embedding = item.embedding;
      const similarity = cosineSimilarity(targetVector, embedding);
      return {
        ...transform(item),
        similarity
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

