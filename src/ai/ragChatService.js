/**
 * Unified RAG Chat Service
 *
 * This file handles the entire Chat process for the Missing Person Chatbot.
 * It is designed to be beginner-friendly by reading linearly top-to-bottom:
 * 1. Search the database for matching records
 * 2. Format those records into a text string
 * 3. Inject that string into a simple prompt template
 * 4. Ask the LLM to generate an answer
 */
const { ChatGroq } = require("@langchain/groq");
const aiConfig = require("../../config/ai");
const { similaritySearch } = require("../../services/vectorStoreService");

// Initialize the Chat Model (Groq / Llama / Gemini based on config)
// We set temperature to 0.1 so it gives factual answers rather than creative ones.
const chatModel = new ChatGroq({
  apiKey: aiConfig.groq.apiKey,
  model: aiConfig.groq.chatModel,
  temperature: 0.1,
  maxTokens: 1024,
});

// The System Prompt instructs the AI how to behave.
// We explicitly tell it NOT to invent facts, and to answer using ONLY the context.
const SYSTEM_PROMPT_TEMPLATE = `You are an AI assistant for the Missing Person Management System.

Answer ONLY using the provided context.

If the answer is not available in the context, reply:
"I couldn't find that information."

Never invent facts or make assumptions beyond what is provided in the context.

Context:
{context}
`;

/**
 * Processes a user message through the RAG pipeline and returns an answer.
 *
 * @param {string} userMessage - The question asked by the user
 * @returns {Promise<Object>} { answer: string }
 */
async function processMessage(userMessage) {
  // STEP 1: Search the Database
  // We look for the 5 most relevant missing person records matching the user's question.
  const matches = await similaritySearch(userMessage, 5);

  // OPTIMIZATION: Early Exit
  // If we didn't find any relevant records, we can stop right here.
  // This saves time and avoids making an unnecessary API call to the LLM.
  if (!matches || matches.length === 0) {
    return { answer: "I couldn't find that information." };
  }

  // STEP 2: Format the Context
  // We take the database matches and turn them into a single, neat text string.
  const contextText = matches
    .map((match, index) => {
      // match.content contains the pre-formatted text (Name, Age, etc.)
      // match.similarity is the cosine distance score (1 is exact match)
      const relevancePercent = (match.similarity * 100).toFixed(1);
      return `[Result ${index + 1}]\n${match.content}\n(Relevance: ${relevancePercent}%)`;
    })
    .join("\n\n");

  // STEP 3: Prepare the Prompt
  // We replace the "{context}" placeholder in our template with our real data.
  const finalSystemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{context}", contextText);

  // STEP 4: Talk to the LLM
  // We send the system instructions and the user's question to the AI model.
  const response = await chatModel.invoke([
    { role: "system", content: finalSystemPrompt },
    { role: "user", content: userMessage }
  ]);

  // Return the AI's generated text
  return { answer: response.content };
}

module.exports = {
  processMessage,
};
