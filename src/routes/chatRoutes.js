/**
 * Chat Routes
 *
 * Defines the API endpoint for the RAG chatbot.
 */
const express = require("express");
const router = express.Router();
const { chatHandler } = require("../controllers/chatController");

// POST /api/chat - Send a message to the RAG chatbot
router.post("/chat", chatHandler);

module.exports = router;
