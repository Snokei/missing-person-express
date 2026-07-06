/**
 * Vector Store Service
 *
 * Manages the lifecycle of vector embeddings in the PostgreSQL vector_store table.
 * Handles insertion, updating, deletion, and similarity search of embeddings.
 */
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { MissingPerson } = require("../models");
const VectorStore = require("../models/VectorStore");
const {
  formatPersonForEmbedding,
  generateEmbedding,
  generateQueryEmbedding,
} = require("../src/ai/embeddings/embeddingService");

/**
 * Computes cosine similarity between two vectors.
 *
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Cosine similarity score (0 to 1)
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  return denom === 0 ? 0 : dotProduct / denom;
}

/**
 * Ingests (creates or updates) a vector embedding for a MissingPerson record.
 *
 * @param {number} missingPersonId - The ID of the MissingPerson record
 * @returns {Promise<Object>} The created or updated VectorStore record
 */
async function ingestMissingPerson(missingPersonId) {
  // Fetch the missing person record with all fields
  const person = await MissingPerson.findByPk(missingPersonId, { raw: true });
  if (!person) {
    throw new Error(`MissingPerson with id ${missingPersonId} not found`);
  }

  // Convert record to searchable text
  const content = formatPersonForEmbedding(person);

  // Generate embedding vector
  const embedding = await generateEmbedding(content);

  // Store embedding as JSON string in the content table (for compatibility with Sequelize)
  const embeddingJson = JSON.stringify(embedding);

  // Upsert: create or update the vector entry
  const [record, created] = await VectorStore.upsert({
    missing_person_id: missingPersonId,
    content,
    embedding: embeddingJson,
  });

  console.log(
    `✅ Vector ${created ? "created" : "updated"} for MissingPerson ID ${missingPersonId}`
  );

  return record;
}

/**
 * Deletes the vector embedding for a MissingPerson record.
 *
 * @param {number} missingPersonId - The ID of the MissingPerson record
 * @returns {Promise<number>} Number of deleted rows
 */
async function deleteVector(missingPersonId) {
  const deleted = await VectorStore.destroy({
    where: { missing_person_id: missingPersonId },
  });

  if (deleted > 0) {
    console.log(`🗑️ Vector deleted for MissingPerson ID ${missingPersonId}`);
  }

  return deleted;
}

/**
 * Performs a semantic similarity search against the vector store.
 * Uses cosine similarity computed in-memory as a fallback.
 *
 * For production, use a dedicated vector index (e.g., pgvector's ivfflat index)
 * which can be queried via raw SQL for better performance.
 *
 * @param {string} query - The user's query text
 * @param {number} [k=5] - Number of top results to return
 * @returns {Promise<Array>} Array of { content, similarity, missingPerson } objects
 */
async function similaritySearch(query, k = 5) {
  // Generate embedding for the query
  const queryEmbedding = await generateQueryEmbedding(query);

  // Fetch all stored vectors with their associated MissingPerson data
  const vectors = await VectorStore.findAll({
    include: [
      {
        model: MissingPerson,
        as: "missingPerson",
        required: false,
      },
    ],
  });

  if (vectors.length === 0) {
    return [];
  }

  // Compute cosine similarity for each stored vector
  const scored = vectors.map((vec) => {
    const storedEmbedding = JSON.parse(vec.embedding);
    const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);

    return {
      id: vec.id,
      content: vec.content,
      similarity,
      missingPersonId: vec.missing_person_id,
      missingPerson: vec.missingPerson,
    };
  });

  // Sort by similarity descending and take top k
  scored.sort((a, b) => b.similarity - a.similarity);
  const topResults = scored.slice(0, k);

  return topResults;
}

/**
 * Runs a raw pgvector similarity search using the ivfflat index.
 * This is more performant for large datasets (thousands+ records).
 *
 * @param {string} query - The user's query text
 * @param {number} [k=5] - Number of top results to return
 * @returns {Promise<Array>} Array of { content, similarity, missing_person_id }
 */
async function rawVectorSearch(query, k = 5) {
  const queryEmbedding = await generateQueryEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Use Sequelize's raw query to leverage pgvector's index-based search
  const results = await sequelize.query(
    `
    SELECT
      vs.id,
      vs.content,
      vs.missing_person_id,
      1 - (vs.embedding <=> CAST(:embedding AS vector(768))) AS similarity
    FROM vector_store vs
    ORDER BY vs.embedding <=> CAST(:embedding AS vector(768))
    LIMIT :k
    `,
    {
      replacements: { embedding: embeddingStr, k },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return results;
}

module.exports = {
  ingestMissingPerson,
  deleteVector,
  similaritySearch,
  rawVectorSearch,
};