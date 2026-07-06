/**
 * Chat Controller
 *
 * Handles HTTP requests for the RAG chatbot endpoint.
 * Validates input, invokes the chat chain, and returns structured responses.
 */
const { processMessage } = require("../src/ai/chains/chatChain");

/**
 * POST /api/chat
 *
 * Accepts a user message and returns an AI-generated answer
 * based on the missing person records in the database.
 *
 * Request body:
 *   { "message": "Where was Rahul last seen?" }
 *
 * Success response (200):
 *   { "answer": "Rahul was last seen near Tower Chowk on 14 June 2026." }
 *
 * Error responses:
 *   400 - Bad request (missing or invalid message)
 *   500 - Internal server error
 */
async function chatHandler(req, res) {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "A valid 'message' field is required.",
      });
    }

    // Process the message through the RAG pipeline
    const result = await processMessage(message.trim());

    // Return the answer
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Chat error:", error.message);

    // Handle specific error types
    if (error.message.includes("API key")) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "AI service is not configured. Please set GEMINI_API_KEY.",
      });
    }

    if (error.message.includes("quota") || error.message.includes("rate")) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "AI service rate limit exceeded. Please try again later.",
      });
    }

    // Generic server error
    return res.status(500).json({
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
    });
  }
}

module.exports = {
  chatHandler,
};