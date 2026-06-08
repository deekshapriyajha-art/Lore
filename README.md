# Lore

I built Lore to solve a problem - joining a project or exploring a new library and spending way too long reading through READMEs trying to understand how things work.

Lore lets you point it at any GitHub repository and just ask questions about it in plain English. It reads the docs, understands them, and answers you directly — with citations so you know exactly where the answer came from.

## What it does

You give Lore a GitHub URL. It fetches the markdown documentation, splits it into chunks, converts each chunk into a vector embedding, and stores everything in a PostgreSQL database. When you ask a question, it embeds your question the same way, finds the most relevant chunks using cosine similarity search, and sends those chunks to an AI model to generate a grounded answer.

No hallucinations about your own codebase. If the answer isn't in the docs, it says so.

## Architecture

There are two completely separate phase of operation.

The **ingestion phase** runs offline. You submit a GitHub URL through the admin panel, the system fetches the raw markdown, parses it into structured sections, splits it into overlapping 300-token chunks that never cross heading boundaries, embeds each chunk with OpenAI, and stores the vectors in pgvector with an HNSW index for fast retrieval.

The **query phase** runs in real time. When you ask a question, it gets embedded with the same model, the embedding is used to run a cosine similarity search against all stored chunks, the top 5 most relevant chunks are assembled into a system prompt, and the answer streams back token by token via SSE.
```text
GitHub URL → Fetch → Parse → Chunk → Embed → pgvector
↓
User question → Embed → Vector search → Build prompt → Stream answer
```

By keeping everything in PostgreSQL rather than adding a separate vector database. pgvector with an HNSW index gives sub-millisecond similarity search without the operational complexity of a dedicated vector store.

## Running it locally

You'll need Node.js v18+, PostgreSQL 16, and the pgvector extension installed.

```bash
git clone https://github.com/deekshapriyajha-art/lore.git
cd lore
```

Set up the database:

```bash
psql -U YOUR_USERNAME -c "CREATE DATABASE lore_db;"
psql -U YOUR_USERNAME -d lore_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -U YOUR_USERNAME -d lore_db -f server/migrations/001_init.sql
```

Configure environment variables:

```bash
cd server
cp .env.example .env
# Add your OpenAI API key and GitHub token
```

Start the API:

```bash
cd server && npm install && npm run dev
```

Start the frontend:

```bash
cd client && npm install && npm run dev
```

Open `http://localhost:5173`, go to the Admin tab, paste a GitHub URL, and start asking questions.

