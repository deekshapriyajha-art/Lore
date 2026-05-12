CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_url  TEXT NOT NULL UNIQUE,
  title       TEXT,
  raw_content TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chunks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  chunk_index  INTEGER NOT NULL,
  heading      TEXT,
  token_count  INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE embeddings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chunk_id    UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  vector      vector(1536) NOT NULL,
  model       TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ingestion_jobs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_url  TEXT NOT NULL,
  document_id UUID REFERENCES documents(id),
  status      TEXT NOT NULL DEFAULT 'queued',
  error       TEXT,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON embeddings USING hnsw (vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX ON chunks (document_id);
CREATE INDEX ON embeddings (chunk_id);
