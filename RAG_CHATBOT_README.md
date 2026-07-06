# RAG Chatbot for Missing Person Management System

A Retrieval-Augmented Generation (RAG) chatbot that answers questions about missing persons using Google Gemini AI and pgvector.

## Tech Stack

- **Node.js** + **Express.js** - Backend framework
- **Sequelize ORM** + **PostgreSQL** - Database
- **pgvector** - Vector similarity search
- **LangChain.js** - LLM orchestration framework
- **Google Gemini API** - Embeddings + Chat model

## Architecture

```
User Query → Embedding → Vector Search → Context Retrieval → Gemini LLM → Answer
```

### Folder Structure

```
src/
├── config/
│   ├── ai.js              # Gemini API configuration
│   └── pgvector.sql       # SQL to enable pgvector extension
├── ai/
│   ├── embeddings/
│   │   └── embeddingService.js  # Text-to-embedding conversion
│   ├── retriever/
│   │   └── retrieverService.js  # Context retrieval from vector DB
│   ├── prompts/
│   │   └── chatPrompt.js        # System prompt template
│   └── chains/
│       └── chatChain.js         # RAG pipeline orchestrator
├── controllers/
│   └── chatController.js        # HTTP request handler
├── routes/
│   └── chatRoutes.js            # POST /api/chat endpoint
├── models/
│   └── VectorStore.js           # Sequelize model for vectors
└── services/
    ├── vectorStoreService.js    # CRUD for vector embeddings
    └── seedVectors.js           # Bulk-ingest existing records
```

## Prerequisites

1. **Google Gemini API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Click "Get API Key"
   - Create a new API key

2. **PostgreSQL with pgvector**
   - Your Supabase PostgreSQL instance already supports pgvector
   - Run the SQL in `src/config/pgvector.sql` in your Supabase SQL Editor

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Google Gemini AI for RAG Chatbot
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_CHAT_MODEL=gemini-2.0-flash
GEMINI_EMBEDDING_MODEL=models/text-embedding-004
```

### 3. Enable pgvector in PostgreSQL

Open your Supabase project's SQL Editor and run the SQL from `src/config/pgvector.sql`:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the vector_store table
CREATE TABLE IF NOT EXISTS vector_store (
    id BIGSERIAL PRIMARY KEY,
    missing_person_id BIGINT NOT NULL UNIQUE REFERENCES missing_persons(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_vector_store_embedding
    ON vector_store
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

### 4. Seed Existing Records

To ingest all existing missing person records into the vector store:

```bash
node src/services/seedVectors.js
```

This will generate embeddings for every record in your `missing_persons` table.

### 5. Start the Server

```bash
npm start
# or
npm run dev
```

## API Usage

### Chat Endpoint

```
POST /api/chat
```

**Request:**
```json
{
  "message": "Where was Rahul last seen?"
}
```

**Response:**
```json
{
  "answer": "Rahul was last seen at Tower Chowk, Ujjain on 14 June 2026."
}
```

### Example Queries

| Query | Expected Behavior |
|---|---|
| "Where was Rahul last seen?" | Returns last seen location and date |
| "Tell me about Rahul Sharma" | Returns full details of Rahul Sharma |
| "Show me case MP-2026-0012" | Returns details of that case number |
| "Who is missing from Ujjain?" | Lists missing persons from Ujjain |
| "Which missing person is 12 years old?" | Returns person with age 12 |
| "What is the status of case MP-2026-0012?" | Returns the status |
| "How old is Priya?" | Returns age of Priya |

### Error Responses

**400 Bad Request** - Missing or invalid message:
```json
{
  "error": "Bad Request",
  "message": "A valid 'message' field is required."
}
```

**503 Service Unavailable** - API key not configured:
```json
{
  "error": "Service Unavailable",
  "message": "AI service is not configured. Please set GEMINI_API_KEY."
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "error": "Too Many Requests",
  "message": "AI service rate limit exceeded. Please try again later."
}
```

**500 Internal Server Error** - Unexpected error:
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later."
}
```

## Auto-Ingestion

When a new missing person is **created** or **updated** via the API, the system automatically:

1. Converts the record into searchable text
2. Generates an embedding using Google's embedding model
3. Stores/updates the vector in the `vector_store` table

When a missing person is **deleted**, the associated vector is also removed.

## How It Works

1. **User sends a question** → `POST /api/chat`
2. **Question is embedded** → Converted to a vector using `text-embedding-004`
3. **Vector search** → Finds top 5 most similar records using cosine similarity
4. **Context is formatted** → Retrieved records are formatted as structured context
5. **Gemini generates answer** → LLM answers using ONLY the provided context
6. **Response returned** → Clean answer with no hallucinations

## Extending the System

To add more data sources (e.g., Missing Items, Officer Notes, Documents):

1. Create a new embedding text formatter for each model
2. Add a new VectorStore entry for each source type (or add a `source_type` column)
3. Update the retriever to search across all sources
4. Update the prompt to handle multiple source types

## Security

- The `/api/chat` endpoint is currently **public**. Add authentication middleware if needed by uncommenting the `protect` middleware in `src/routes/chatRoutes.js`.
- API key validation happens at application startup.
- Vector operations are non-blocking — the main API won't fail if vector ingestion fails.