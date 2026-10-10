-- One row per answered (or failed) question. No IP addresses, no cookies: nothing here
-- identifies a visitor. Rows older than RETENTION_DAYS are deleted by the daily cron.
CREATE TABLE messages (
  id            TEXT PRIMARY KEY,
  ts            INTEGER NOT NULL,          -- ms since epoch
  site          TEXT NOT NULL,
  context       TEXT NOT NULL,
  locale        TEXT NOT NULL,
  question      TEXT NOT NULL,
  state_json    TEXT NOT NULL,
  history_turns INTEGER NOT NULL,
  answer        TEXT NOT NULL,
  model         TEXT NOT NULL,
  stop_reason   TEXT,
  error         TEXT,
  in_tok        INTEGER,
  out_tok       INTEGER,
  cache_read_tok  INTEGER,
  cache_write_tok INTEGER,
  latency_ms    INTEGER
);
CREATE INDEX messages_ts ON messages (ts);

-- Thumbs up (1) / down (-1) under an answer; a second vote replaces the first.
CREATE TABLE feedback (
  message_id TEXT PRIMARY KEY REFERENCES messages (id) ON DELETE CASCADE,
  ts         INTEGER NOT NULL,
  vote       INTEGER NOT NULL CHECK (vote IN (-1, 1))
);

-- Daily request counters. key = '*' for everyone, otherwise an HMAC of (day, address) under a
-- secret-derived key: it changes every day and can't be traced back to an address.
CREATE TABLE quota (
  day TEXT NOT NULL,
  key TEXT NOT NULL,
  n   INTEGER NOT NULL,
  PRIMARY KEY (day, key)
);
