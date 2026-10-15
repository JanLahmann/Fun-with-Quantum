-- The RasQberry tester programme (context rasqberry/tester). Testers pick their own name or ID
-- (no e-mail address); everything here is deleted after the context's retention (90 days).

-- Which tester asked (only for the tester context; null everywhere else).
ALTER TABLE messages ADD COLUMN tester TEXT;

-- One row per tester: hardware and interests from the widget's form, as JSON.
CREATE TABLE testers (
  id          TEXT PRIMARY KEY,           -- lower-cased tester name or ID
  preferences TEXT NOT NULL DEFAULT '{}',
  first_seen  INTEGER NOT NULL,           -- ms since epoch
  last_seen   INTEGER NOT NULL
);

-- Where each tester is with each mission; the tester sets it with the widget's buttons.
CREATE TABLE mission_status (
  tester     TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  state      TEXT NOT NULL CHECK (state IN ('suggested', 'started', 'done', 'skipped')),
  ts         INTEGER NOT NULL,
  PRIMARY KEY (tester, mission_id)
);
CREATE INDEX mission_status_mission ON mission_status (mission_id);

-- A finding is saved only by the tester's click on the draft card the helper wrote.
CREATE TABLE findings (
  id            TEXT PRIMARY KEY,
  ts            INTEGER NOT NULL,
  tester        TEXT NOT NULL,
  mission_id    TEXT,
  image_version TEXT,
  pi_model      TEXT,
  hardware      TEXT NOT NULL DEFAULT '{}', -- JSON: the tester's preferences when saved
  kind          TEXT NOT NULL CHECK (kind IN ('bug', 'docs', 'confusing', 'idea', 'praise')),
  severity      TEXT CHECK (severity IN ('blocker', 'major', 'minor')),
  title         TEXT NOT NULL,
  expected      TEXT,
  actual        TEXT,
  steps         TEXT,
  confirmed     INTEGER NOT NULL DEFAULT 1,
  message_ids   TEXT NOT NULL DEFAULT '[]', -- JSON: the chat answers the finding came from
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged')),
  issue_url     TEXT
);
CREATE INDEX findings_ts ON findings (ts);
