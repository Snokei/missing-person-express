/**
 * AI Configuration
 *
 * Loads and validates environment variables required for Google Gemini AI.
 * Exports configuration objects for embeddings and chat models.
 */
require("dotenv").config();

const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    chatModel: process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash",
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "embedding-001",
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    chatModel: process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant",
  }
};

// Validate API key presence at startup
if (!config.gemini.apiKey) {
  console.error(
    "❌ GEMINI_API_KEY is not set. Please add it to your .env file.",
  );
  process.exit(1);
}

module.exports = config;