/**
 * Chat Chain
 *
 * Orchestrates the RAG pipeline:
 * 1. Receive user query
 * 2. Retrieve relevant context from vector store
 * 3. Format prompt with context + query
 * 4. Send to Gemini for answer generation
 * 5. Return the answer
 */
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const aiConfig = require("../../../config/ai");
const { createChatPrompt } = require("../prompts/chatPrompt");
const { retrieveContext } = require("../retriever/retrieverService");

// Initialize the Gemini chat model
const chatModel = new ChatGoogleGenerativeAI({
  apiKey: aiConfig.gemini.apiKey,
  model: aiConfig.gemini.chatModel,
  temperature: 0.1, // Low temperature for factual responses
  maxOutputTokens: 1024,
});

// Output parser to extract string from LLM response
const outputParser = new StringOutputParser();

/**
 * Processes a user message through the RAG pipeline and returns an answer.
 *
 * @param {string} message - The user's question
 * @returns {Promise<Object>} { answer: string }
 */
async function processMessage(message) {
  // Step 1: Retrieve relevant context from the vector store
  const context = await retrieveContext(message, 5);

  // Step 2: If no context found, return early
  if (!context || context.trim().length === 0) {
    return {
      answer: "I couldn't find that information.",
    };
  }

  // Step 3: Create the prompt with context and user input
  const prompt = createChatPrompt();
  const formattedPrompt = await prompt.formatMessages({
    context,
    input: message,
  });

  // Step 4: Invoke the Gemini model
  const response = await chatModel.invoke(formattedPrompt);

  // Step 5: Parse the output
  const answer = await outputParser.invoke(response);

  return { answer };
}

module.exports = {
  processMessage,
};