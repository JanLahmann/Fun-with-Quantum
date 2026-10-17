-- Ideas riders tell the CleanJibe help desk (a new feature, an improvement): the model ends such an
-- answer with a hidden [[idea: …]] line, the Worker strips it and keeps the idea here. Nothing that
-- identifies the rider: no app key, no IP, only the date, the channel, the app version and the
-- rider's own words. Kept IDEA_RETENTION_DAYS (a year), apart from the 30-day message log.
CREATE TABLE ideas (
  id          TEXT PRIMARY KEY,           -- the answer's message id
  ts          INTEGER NOT NULL,
  site        TEXT NOT NULL,
  context     TEXT NOT NULL,
  surface     TEXT,                       -- ios | web
  channel     TEXT,                       -- release | beta | dev
  app_version TEXT,
  build       INTEGER,
  locale      TEXT NOT NULL,
  summary     TEXT NOT NULL,              -- the model's one-line summary, in English
  words       TEXT NOT NULL,              -- the rider's question, as sent (keys scrubbed)
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'noted')),
  note        TEXT
);
CREATE INDEX ideas_ts ON ideas (ts);
