-- Migration number: 0001 	 2026-05-29T20:52:49.396Z
CREATE TABLE data_api_tokens (
  id INTEGER PRIMARY KEY,
  token TEXT,
  expired_at TEXT,
  created_at TEXT
);