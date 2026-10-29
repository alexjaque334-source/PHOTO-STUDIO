-- Migration 0080: Suporte a Chunking de Mídias em D1 (Free Tier sem limite de 2MB)
-- Permite armazenar imagens de alta definição > 2MB divididas em fatias de 800KB

CREATE TABLE IF NOT EXISTS media_blobs (
  key TEXT PRIMARY KEY,
  bytes BLOB,
  mime TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  is_chunked INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Tabela de pedaços (chunks) para imagens grandes
CREATE TABLE IF NOT EXISTS media_chunks (
  key TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  data BLOB NOT NULL,
  PRIMARY KEY (key, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_media_chunks_key ON media_chunks(key);
