/**
 * Chat Prompt Template
 *
 * Defines the system prompt for the RAG chatbot.
 * The LLM is instructed to answer ONLY using the provided context
 * and never hallucinate facts.
 */
const {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} = require("@langchain/core/prompts");

// System prompt that enforces grounded, factual responses
const systemPrompt = `You are an AI assistant for the Missing Person Management System.

Answer ONLY using the provided context.

If the answer is not available in the context, reply:

"I couldn't find that information."

Never invent facts or make assumptions beyond what is provided in the context.

Context:
{context}

Question:
{input}

Answer in a concise and helpful manner.`;

/**
 * Creates and returns a LangChain ChatPromptTemplate.
 *
 * @returns {ChatPromptTemplate} The configured prompt template
 */
function createChatPrompt() {
  return ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(systemPrompt),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
  ]);
}

module.exports = {
  createChatPrompt,
};