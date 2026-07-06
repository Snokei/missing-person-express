/**
 * Retriever Service
 *
 * Bridges the vector store and the AI chat chain.
 * Provides a clean interface to retrieve relevant context for a user query.
 */
const { similaritySearch, rawVectorSearch } = require("../../../services/vectorStoreService");

/**
 * Retrieves the top-k most relevant context strings for a given query.
 * Uses the in-memory cosine similarity search by default.
 *
 * For large production datasets, consider using rawVectorSearch
 * which leverages pgvector's ivfflat index.
 *
 * @param {string} query - The user's question
 * @param {number} [k=5] - Number of top results to retrieve
 * @returns {Promise<string>} Concatenated context string for the LLM prompt
 */
async function retrieveContext(query, k = 5) {
  const results = await similaritySearch(query, k);

  if (!results || results.length === 0) {
    return "";
  }

  // Format results into a structured context block for the LLM
  const context = results
    .map(
      (result, index) =>
        `[Result ${index + 1}]\n${result.content}\n(Relevance: ${(result.similarity * 100).toFixed(1)}%)`
    )
    .join("\n\n");

  return context;
}

/**
 * Retrieves context using raw pgvector similarity search.
 * More performant for large datasets.
 *
 * @param {string} query - The user's question
 * @param {number} [k=5] - Number of top results to retrieve
 * @returns {Promise<string>} Concatenated context string for the LLM prompt
 */
async function retrieveContextRaw(query, k = 5) {
  const results = await rawVectorSearch(query, k);

  if (!results || results.length === 0) {
    return "";
  }

  const context = results
    .map(
      (result, index) =>
        `[Result ${index + 1}]\n${result.content}\n(Relevance: ${(result.similarity * 100).toFixed(1)}%)`
    )
    .join("\n\n");

  return context;
}

module.exports = {
  retrieveContext,
  retrieveContextRaw,
};