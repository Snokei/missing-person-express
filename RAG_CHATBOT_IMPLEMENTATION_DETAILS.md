# RAG Chatbot — Implementation Details

This document provides a **function-by-function breakdown** of every file in the RAG chatbot system, explaining what each function does, its parameters, return values, and how it was implemented.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [src/config/ai.js — AI Configuration](#1-srcconfigaijs--ai-configuration)
3. [src/ai/embeddings/embeddingService.js — Embedding Service](#2-srcaicontrollerembeddingembeddingServicejs--embedding-service)
4. [src/ai/retriever/retrieverService.js — Retriever Service](#3-srcaicontrollerretrieverretrieverServicejs--retriever-service)
5. [src/ai/prompts/chatPrompt.js — Chat Prompt](#4-srcaicontrollerpromptschatPromptjs--chat-prompt)
6. [src/ai/chains/chatChain.js — Chat Chain (Orchestrator)](#5-srcaicontrollerchainschatChainjs--chat-chain-orchestrator)
7. [src/controllers/chatController.js — Chat Controller](#6-srccontrollerschatControllerjs--chat-controller)
8. [src/routes/chatRoutes.js — Chat Routes](#7-srcrouteschatRoutesjs--chat-routes)
9. [src/models/VectorStore.js — Vector Store Model](#8-srcmodelsvectorStorejs--vector-store-model)
10. [src/services/vectorStoreService.js — Vector Store Service](#9-srcservicesvectorStoreServicejs--vector-store-service)
11. [src/services/seedVectors.js — Seed Script](#10-srcservicesseedVectorsjs--seed-script)
12. [Data Flow Summary](#data-flow-summary)

---

## Architecture Overview

```
User Query → POST /api/chat
                ↓
         chatController.js
          (validates input)
                ↓
          chatChain.js
     (orchestrates RAG pipeline)
                ↓
     ┌───────────────────────┐
     │   retrieverService.js  │
     │  (fetches context)     │
     └───────────┬───────────┘
                 ↓
     ┌───────────────────────┐
     │  vectorStoreService.js │
     │  (similarity search)   │
     └───────────┬───────────┘
                 ↓
     ┌───────────────────────┐
     │  embeddingService.js   │
     │  (query → vector)      │
     └───────────────────────┘
                 ↓
     ┌───────────────────────┐
     │   chatPrompt.js        │
     │  (context + query)     │
     └───────────┬───────────┘
                 ↓
          Gemini LLM
      (generates answer)
                 ↓
         JSON Response
```

---

## 1. src/config/ai.js — AI Configuration

### Purpose
Loads and validates environment variables for Google Gemini AI. Exits the process if `GEMINI_API_KEY` is missing.

### Exported Object

```js
{
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,                    // Required
    chatModel: process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash",  // Default
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "embedding-001", // Default
  }
}
```

### Implementation Notes
- Uses `dotenv` to load `.env` file variables.
- Provides sensible defaults for model names so only the API key is strictly required.
- Calls `process.exit(1)` if the API key is missing — this prevents the server from starting without AI capabilities.

---

## 2. src/ai/embeddings/embeddingService.js — Embedding Service

### Purpose
Converts MissingPerson records into searchable text and generates vector embeddings using Google's embedding model.

### Functions

#### `formatPersonForEmbedding(person)`

| Aspect | Details |
|--------|---------|
| **Purpose** | Converts a MissingPerson database record into a structured, searchable text string |
| **Parameter** | `person` — A MissingPerson object (from Sequelize) |
| **Returns** | `string` — Newline-separated key-value pairs of all non-null fields |
| **Implementation** | Iterates over 15 possible fields (case_number, name, gender, age, mobile, language, height, weight, medical_condition, identification_mark, last_seen_location, last_seen_date, last_seen_time, circumstances, status). Only includes fields that have a value. Joins them with `\n`. |

**Example output:**
```
Case Number: MP-2026-0012
Name: Rahul Sharma
Gender: Male
Age: 25
Last Seen Location: Tower Chowk, Ujjain
Last Seen Date: 2026-06-14
Status: Missing
```

#### `generateEmbedding(text)`

| Aspect | Details |
|--------|---------|
| **Purpose** | Generates a vector embedding for a given text string |
| **Parameter** | `text` — The text to embed (typically the formatted person string) |
| **Returns** | `Promise<number[]>` — An array of 768 floating-point numbers |
| **Implementation** | Uses `GoogleGenerativeAIEmbeddings.embedDocuments()` from LangChain. Wraps the text in an array (as required by LangChain) and destructures the first result. Throws a descriptive error on failure. |

#### `generateQueryEmbedding(query)`

| Aspect | Details |
|--------|---------|
| **Purpose** | Generates a vector embedding for a user's query string |
| **Parameter** | `query` — The user's natural language question |
| **Returns** | `Promise<number[]>` — An array of 768 floating-point numbers |
| **Implementation** | Uses `GoogleGenerativeAIEmbeddings.embedQuery()` from LangChain. This is the single-input variant optimized for queries (as opposed to `embedDocuments` which handles batches). |

### Key Design Decision
Two separate functions (`generateEmbedding` vs `generateQueryEmbedding`) are used because LangChain's API treats document embedding and query embedding differently under the hood. Some models use different internal preprocessing for queries vs documents.

---

## 3. src/ai/retriever/retrieverService.js — Retriever Service

### Purpose
Bridges the vector store and the AI chat chain. Provides a clean interface to retrieve relevant context for a user query.

### Functions

#### `retrieveContext(query, k = 5)`

| Aspect | Details |
|--------|---------|
| **Purpose** | Retrieves the top-k most relevant context strings for a given query using in-memory cosine similarity |
| **Parameters** | `query` (string) — The user's question; `k` (number, default 5) — Number of results |
| **Returns** | `Promise<string>` — Formatted context string, or empty string if no results |
| **Implementation** | 1. Calls `similaritySearch(query, k)` from vectorStoreService. 2. Maps each result to a formatted block: `[Result N]\n{content}\n(Relevance: X.X%)`. 3. Joins blocks with double newlines. |

**Example output:**
```
[Result 1]
Case Number: MP-2026-0012
Name: Rahul Sharma
Gender: Male
Age: 25
Last Seen Location: Tower Chowk, Ujjain
Last Seen Date: 2026-06-14
Status: Missing
(Relevance: 92.3%)

[Result 2]
Case Number: MP-2026-0015
Name: Rahul Verma
...
(Relevance: 78.1%)
```

#### `retrieveContextRaw(query, k = 5)`

| Aspect | Details |
|--------|---------|
| **Purpose** | Same as `retrieveContext` but uses pgvector's ivfflat index for better performance on large datasets |
| **Parameters** | Same as above |
| **Returns** | Same as above |
| **Implementation** | Calls `rawVectorSearch(query, k)` which runs a raw SQL query using the `<=>` (cosine distance) operator on the pgvector column. |

### Key Design Decision
Two retrieval methods are provided:
- **`retrieveContext`** — Uses in-memory cosine similarity. Good for small-to-medium datasets (up to ~10,000 records). No raw SQL needed.
- **`retrieveContextRaw`** — Uses pgvector's indexed search. Required for large datasets. Requires the ivfflat index to be created (see `pgvector.sql`).

---

## 4. src/ai/prompts/chatPrompt.js — Chat Prompt

### Purpose
Defines the system prompt template that instructs the LLM to answer ONLY using the provided context.

### Functions

#### `createChatPrompt()`

| Aspect | Details |
|--------|---------|
| **Purpose** | Creates a LangChain `ChatPromptTemplate` with system and human message templates |
| **Returns** | `ChatPromptTemplate` — A LangChain prompt template object |
| **Implementation** | Uses `ChatPromptTemplate.fromMessages()` with two messages: 1. A `SystemMessagePromptTemplate` with the system prompt (which includes `{context}` and `{input}` placeholders). 2. A `HumanMessagePromptTemplate` with just `{input}`. |

### System Prompt Text
```
You are an AI assistant for the Missing Person Management System.

Answer ONLY using the provided context.

If the answer is not available in the context, reply:

"I couldn't find that information."

Never invent facts or make assumptions beyond what is provided in the context.

Context:
{context}

Question:
{input}

Answer in a concise and helpful manner.
```

### Key Design Decision
- **Temperature set to 0.1** (in chatChain.js) — Low temperature ensures factual, deterministic responses.
- **Explicit anti-hallucination instruction** — The prompt explicitly tells the LLM not to invent facts.
- **Fallback response** — If context is empty, the chain returns "I couldn't find that information." before even calling the LLM.

---

## 5. src/ai/chains/chatChain.js — Chat Chain (Orchestrator)

### Purpose
Orchestrates the entire RAG pipeline: retrieves context, formats the prompt, invokes Gemini, and returns the answer.

### Functions

#### `processMessage(message)`

| Aspect | Details |
|--------|---------|
| **Purpose** | The main entry point for processing a user message through the RAG pipeline |
| **Parameter** | `message` (string) — The user's question |
| **Returns** | `Promise<{ answer: string }>` — Object containing the AI-generated answer |
| **Implementation** | 5-step pipeline: |

**Step-by-step flow:**

```
Step 1: Retrieve Context
    const context = await retrieveContext(message, 5);
    → Calls retrieverService to get top-5 relevant records

Step 2: Early Exit (No Context)
    if (!context || context.trim().length === 0) {
      return { answer: "I couldn't find that information." };
    }
    → If no relevant records found, return early without calling LLM

Step 3: Format Prompt
    const prompt = createChatPrompt();
    const formattedPrompt = await prompt.formatMessages({
      context,
      input: message,
    });
    → Injects context and user query into the prompt template

Step 4: Invoke Gemini
    const response = await chatModel.invoke(formattedPrompt);
    → Sends the formatted prompt to Google Gemini

Step 5: Parse Output
    const answer = await outputParser.invoke(response);
    return { answer };
    → Extracts the text response from the LLM's structured output
```

### Initialized Objects

| Object | Configuration |
|--------|---------------|
| `chatModel` | `ChatGoogleGenerativeAI` with `apiKey`, `model: "gemini-2.5-flash"`, `temperature: 0.1`, `maxOutputTokens: 1024` |
| `outputParser` | `StringOutputParser` — Extracts plain text from LangChain's `AIMessage` response |

### Key Design Decision
- **Early exit optimization** — If no context is found, the function returns immediately without making an expensive LLM API call. This saves both cost and latency.
- **Low temperature (0.1)** — Ensures responses are factual and consistent, not creative.

---

## 6. src/controllers/chatController.js — Chat Controller

### Purpose
Handles HTTP requests for the RAG chatbot endpoint. Validates input, invokes the chat chain, and returns structured JSON responses.

### Functions

#### `chatHandler(req, res)`

| Aspect | Details |
|--------|---------|
| **Purpose** | Express route handler for `POST /api/chat` |
| **Parameters** | `req` — Express request object; `res` — Express response object |
| **Returns** | JSON response (status 200, 400, 503, 429, or 500) |
| **Implementation** | |

**Request Validation:**
```js
const { message } = req.body;
if (!message || typeof message !== "string" || message.trim().length === 0) {
  return res.status(400).json({
    error: "Bad Request",
    message: "A valid 'message' field is required.",
  });
}
```
- Checks that `message` exists, is a string, and is not empty/whitespace.

**Success Response (200):**
```json
{ "answer": "Rahul was last seen near Tower Chowk on 14 June 2026." }
```

**Error Handling:**

| Condition | Status | Error Message |
|-----------|--------|---------------|
| Missing/invalid message | 400 | "A valid 'message' field is required." |
| API key not configured | 503 | "AI service is not configured. Please set GEMINI_API_KEY." |
| Rate limit exceeded | 429 | "AI service rate limit exceeded. Please try again later." |
| Any other error | 500 | "An unexpected error occurred. Please try again later." |

Error detection is done by checking the error message string for keywords:
- `error.message.includes("API key")` → 503
- `error.message.includes("quota")` or `error.message.includes("rate")` → 429
- Everything else → 500

---

## 7. src/routes/chatRoutes.js — Chat Routes

### Purpose
Defines the Express route for the RAG chatbot endpoint.

### Route

| Method | Path | Handler |
|--------|------|---------|
| POST | `/chat` | `chatHandler` |

### Registration in Main Router

In `routes/index.js`:
```js
const chatRoutes = require("../src/routes/chatRoutes");
router.use("/api", chatRoutes);
```

This means the full endpoint path is: **`POST /api/chat`**

---

## 8. src/models/VectorStore.js — Vector Store Model

### Purpose
Sequelize model for the `vector_store` table in PostgreSQL. Stores embeddings for MissingPerson records.

### Table Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PK, Auto-increment | Primary key |
| `missing_person_id` | BIGINT | NOT NULL, UNIQUE, FK → missing_persons(id) ON DELETE CASCADE | Links to the missing person record |
| `content` | TEXT | NOT NULL | Formatted text representation of the record |
| `embedding` | TEXT | NOT NULL | Vector embedding stored as JSON array string |
| `created_at` | TIMESTAMP | Auto | Creation timestamp |
| `updated_at` | TIMESTAMP | Auto | Update timestamp |

### Important Implementation Detail

The `embedding` column is stored as `DataTypes.TEXT` (a JSON string) rather than using pgvector's native `vector(768)` type. This is because **Sequelize does not natively support the pgvector extension's vector type**. The actual pgvector column is created via raw SQL (see `pgvector.sql`), and the Sequelize model stores the embedding as a JSON string for compatibility.

### Association

```js
VectorStore.belongsTo(models.MissingPerson, {
  foreignKey: "missing_person_id",
  as: "missingPerson",
});
```

This allows eager-loading the associated MissingPerson record when querying vectors.

---

## 9. src/services/vectorStoreService.js — Vector Store Service

### Purpose
Manages the full lifecycle of vector embeddings: ingestion, deletion, and similarity search.

### Functions

#### `cosineSimilarity(vecA, vecB)`

| Aspect | Details |
|--------|---------|
| **Purpose** | Computes cosine similarity between two vectors (internal helper) |
| **Parameters** | `vecA`, `vecB` — Two arrays of numbers (must be same length) |
| **Returns** | `number` — Cosine similarity score between 0 and 1 |
| **Implementation** | Standard formula: `dotProduct / (magnitudeA * magnitudeB)`. Returns 0 if denominator is 0. |

#### `ingestMissingPerson(missingPersonId)`

| Aspect | Details |
|--------|---------|
| **Purpose** | Creates or updates a vector embedding for a MissingPerson record |
| **Parameter** | `missingPersonId` (number) — The ID of the MissingPerson record |
| **Returns** | `Promise<Object>` — The created/updated VectorStore record |
| **Implementation** | 1. Fetches the MissingPerson record via `findByPk`. 2. Converts to text via `formatPersonForEmbedding()`. 3. Generates embedding via `generateEmbedding()`. 4. Serializes embedding to JSON string. 5. Upserts into VectorStore table. |

**Upsert logic:** Uses Sequelize's `upsert()` method which attempts INSERT first, and if a conflict on `missing_person_id` (unique constraint) occurs, it performs an UPDATE instead.

#### `deleteVector(missingPersonId)`

| Aspect | Details |
|--------|---------|
| **Purpose** | Deletes the vector embedding for a MissingPerson record |
| **Parameter** | `missingPersonId` (number) — The ID of the MissingPerson record |
| **Returns** | `Promise<number>` — Number of deleted rows (0 or 1) |
| **Implementation** | Calls `VectorStore.destroy({ where: { missing_person_id: missingPersonId } })`. |

#### `similaritySearch(query, k = 5)`

| Aspect | Details |
|--------|---------|
| **Purpose** | Performs semantic similarity search using in-memory cosine similarity |
| **Parameters** | `query` (string) — User's question; `k` (number, default 5) — Top results |
| **Returns** | `Promise<Array>` — Array of `{ id, content, similarity, missingPersonId, missingPerson }` |
| **Implementation** | 1. Generates query embedding via `generateQueryEmbedding()`. 2. Fetches ALL vectors from the database (with optional MissingPerson include). 3. Computes cosine similarity for each vector against the query. 4. Sorts by similarity descending. 5. Returns top-k results. |

**Performance consideration:** This loads all vectors into memory. For datasets with thousands of records, use `rawVectorSearch` instead.

#### `rawVectorSearch(query, k = 5)`

| Aspect | Details |
|--------|---------|
| **Purpose** | Performs similarity search using pgvector's native index (ivfflat) |
| **Parameters** | Same as `similaritySearch` |
| **Returns** | `Promise<Array>` — Array of `{ id, content, missing_person_id, similarity }` |
| **Implementation** | Runs a raw SQL query: `SELECT ..., 1 - (vs.embedding <=> CAST(:embedding AS vector(768))) AS similarity FROM vector_store vs ORDER BY vs.embedding <=> CAST(:embedding AS vector(768)) LIMIT :k` |

**SQL Explanation:**
- `<=>` is pgvector's cosine distance operator (returns 0 for identical, 1 for opposite).
- `1 - distance` converts distance to similarity (1 = identical, 0 = opposite).
- `CAST(:embedding AS vector(768))` converts the JSON array string to pgvector's vector type.
- The `ORDER BY ... <=> ...` uses the ivfflat index for fast approximate nearest neighbor search.

---

## 10. src/services/seedVectors.js — Seed Script

### Purpose
Bulk-ingests all existing MissingPerson records into the vector store. Used when setting up the RAG system for the first time.

### Function

#### `seedAllVectors()`

| Aspect | Details |
|--------|---------|
| **Purpose** | Iterates over all MissingPerson records and creates embeddings for each |
| **Parameters** | None |
| **Returns** | Nothing (logs results to console) |
| **Implementation** | 1. Fetches all MissingPerson records. 2. Loops through each record and calls `ingestMissingPerson(id)`. 3. Tracks success/failure counts. 4. Logs summary. 5. Closes database connection. |

### Usage

```bash
node src/services/seedVectors.js
```

### Sample Output
```
🔄 Starting vector seeding for all missing persons...
📊 Found 25 missing person records.
✅ [1/25] Ingested ID 1: Rahul Sharma
✅ [2/25] Ingested ID 2: Priya Patel
...
❌ Failed to ingest ID 7: Some error message

═══════════════════════════════════
🎉 Seeding complete!
   ✅ Successfully ingested: 24
   ❌ Failed: 1
═══════════════════════════════════
```

---

## Data Flow Summary

### Chat Request Flow

```
Client                          Server
  │                                │
  │  POST /api/chat                │
  │  { "message": "Where was      │
  │    Rahul last seen?" }         │
  │ ──────────────────────────►    │
  │                                │
  │         chatController.js      │
  │           │                    │
  │           │ Validate input     │
  │           │ (400 if invalid)   │
  │           ▼                    │
  │         chatChain.js           │
  │           │                    │
  │           │ Step 1: Retrieve   │
  │           │ context            │
  │           ▼                    │
  │    retrieverService.js         │
  │           │                    │
  │           ▼                    │
  │   vectorStoreService.js        │
  │           │                    │
  │      ┌────┴────┐               │
  │      │ Query   │               │
  │      │ Embed   │               │
  │      └────┬────┘               │
  │           │                    │
  │      ┌────┴────┐               │
  │      │ Cosine  │               │
  │      │ Similar │               │
  │      └────┬────┘               │
  │           │                    │
  │           ▼                    │
  │    Top-5 Results               │
  │           │                    │
  │           ▼                    │
  │    retrieverService.js         │
  │    (formats context)           │
  │           │                    │
  │           ▼                    │
  │    chatChain.js                │
  │           │                    │
  │           │ Step 2: Check if   │
  │           │ context empty      │
  │           │ (early return)     │
  │           ▼                    │
  │           │ Step 3: Format     │
  │           │ prompt             │
  │           ▼                    │
  │           │ Step 4: Invoke     │
  │           │ Gemini LLM         │
  │           ▼                    │
  │           │ Step 5: Parse      │
  │           │ output             │
  │           ▼                    │
  │                                │
  │  { "answer": "Rahul was       │
  │    last seen at Tower          │
  │    Chowk, Ujjain on            │
  │    14 June 2026." }            │
  │ ◄──────────────────────────    │
```

### Auto-Ingestion Flow (on Create/Update/Delete)

```
MissingPerson API
  (create/update/delete)
        │
        ▼
  missingPersonController.js
        │
        │ Calls vectorStoreService
        ▼
  ┌─────────────────────┐
  │  ingestMissingPerson │  ← On create or update
  │  deleteVector        │  ← On delete
  └─────────────────────┘
        │
        ▼
  VectorStore table updated
```

This auto-ingestion is triggered from the missing person controller hooks, ensuring the vector store stays in sync with the database.

---

## Error Handling Strategy

| Layer | Error Type | Handling |
|-------|------------|----------|
| **embeddingService.js** | Embedding generation failure | Throws descriptive error with original message |
| **vectorStoreService.js** | Missing person not found | Throws `MissingPerson with id X not found` |
| **chatChain.js** | No context found | Returns early with "I couldn't find that information." (no LLM call) |
| **chatController.js** | API key missing | Returns 503 with clear message |
| **chatController.js** | Rate limit exceeded | Returns 429 with retry suggestion |
| **chatController.js** | Generic error | Returns 500 with generic message |
| **ai.js** | Missing API key at startup | `process.exit(1)` — prevents server from starting |

---

## Key Design Decisions Summary

1. **Two embedding functions** — `embedDocuments` for documents, `embedQuery` for queries (LangChain API requirement).
2. **Two retrieval methods** — In-memory cosine similarity for small datasets, pgvector raw SQL for large datasets.
3. **Early exit optimization** — If no context found, skip LLM call entirely (saves cost and latency).
4. **Low temperature (0.1)** — Ensures factual, deterministic responses.
5. **Sequelize TEXT for embeddings** — pgvector's vector type isn't natively supported by Sequelize, so embeddings are stored as JSON strings.
6. **Upsert pattern** — Same function handles both create and update of vectors.
7. **Startup validation** — Server won't start without a valid Gemini API key.
8. **Error message pattern matching** — Error types are detected by checking message content rather than error classes, making it more flexible across different SDK versions.