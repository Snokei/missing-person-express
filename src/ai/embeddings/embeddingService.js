/**
 * Embedding Service
 *
 * Converts a MissingPerson record into a searchable text string
 * and generates vector embeddings using Google's embedding model.
 */
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const aiConfig = require("../../config/ai");

// Initialize the embeddings model
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: aiConfig.gemini.apiKey,
  model: aiConfig.gemini.embeddingModel,
});

/**
 * Converts a MissingPerson record into a structured text representation
 * that can be embedded and searched semantically.
 *
 * @param {Object} person - A MissingPerson record from Sequelize
 * @returns {string} Formatted text representation of the person
 */
function formatPersonForEmbedding(person) {
  const parts = [];

  if (person.case_number) parts.push(`Case Number: ${person.case_number}`);
  if (person.first_name || person.last_name) {
    parts.push(`Name: ${[person.first_name, person.last_name].filter(Boolean).join(" ")}`);
  }
  if (person.gender) parts.push(`Gender: ${person.gender}`);
  if (person.age) parts.push(`Age: ${person.age}`);
  if (person.missing_person_mobile_number) parts.push(`Mobile: ${person.missing_person_mobile_number}`);
  if (person.language_spoken) parts.push(`Language: ${person.language_spoken}`);
  if (person.height) parts.push(`Height: ${person.height}`);
  if (person.weight) parts.push(`Weight: ${person.weight}`);
  if (person.medical_condition) parts.push(`Medical Condition: ${person.medical_condition}`);
  if (person.identification_mark) parts.push(`Identifying Marks: ${person.identification_mark}`);
  if (person.last_seen_location) parts.push(`Last Seen Location: ${person.last_seen_location}`);
  if (person.last_seen_date) parts.push(`Last Seen Date: ${person.last_seen_date}`);
  if (person.last_seen_time) parts.push(`Last Seen Time: ${person.last_seen_time}`);
  if (person.circumstances) parts.push(`Circumstances: ${person.circumstances}`);
  if (person.status) parts.push(`Status: ${person.status}`);

  return parts.join("\n");
}

/**
 * Generates an embedding vector for the given text.
 *
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} The embedding vector
 */
async function generateEmbedding(text) {
  try {
    const [embedding] = await embeddings.embedDocuments([text]);
    return embedding;
  } catch (error) {
    console.error("❌ Error generating embedding:", error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generates an embedding for a query string (single string input).
 *
 * @param {string} query - The user's query text
 * @returns {Promise<number[]>} The embedding vector
 */
async function generateQueryEmbedding(query) {
  try {
    const embedding = await embeddings.embedQuery(query);
    return embedding;
  } catch (error) {
    console.error("❌ Error generating query embedding:", error.message);
    throw new Error(`Failed to generate query embedding: ${error.message}`);
  }
}

module.exports = {
  formatPersonForEmbedding,
  generateEmbedding,
  generateQueryEmbedding,
};