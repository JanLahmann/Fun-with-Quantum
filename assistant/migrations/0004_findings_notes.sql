-- Findings: triage without a GitHub issue (status 'noted' + note: praise, duplicate, wontfix …),
-- and where the image version came from (the Pi, or the tester's choice in My setup).
-- SQLite can't change a CHECK constraint, so the table is rebuilt with the same rows.
CREATE TABLE findings_new (
  id             TEXT PRIMARY KEY,
  ts             INTEGER NOT NULL,
  tester         TEXT NOT NULL,
  mission_id     TEXT,
  image_version  TEXT,
  version_source TEXT CHECK (version_source IN ('pi', 'setup')),
  pi_model       TEXT,
  hardware       TEXT NOT NULL DEFAULT '{}',
  kind           TEXT NOT NULL CHECK (kind IN ('bug', 'docs', 'confusing', 'idea', 'praise')),
  severity       TEXT CHECK (severity IN ('blocker', 'major', 'minor')),
  title          TEXT NOT NULL,
  expected       TEXT,
  actual         TEXT,
  steps          TEXT,
  confirmed      INTEGER NOT NULL DEFAULT 1,
  message_ids    TEXT NOT NULL DEFAULT '[]',
  status         TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'noted')),
  issue_url      TEXT,
  note           TEXT
);
INSERT INTO findings_new (id, ts, tester, mission_id, image_version, version_source, pi_model, hardware, kind, severity, title,
  expected, actual, steps, confirmed, message_ids, status, issue_url)
SELECT id, ts, tester, mission_id, image_version, CASE WHEN image_version IS NULL THEN NULL ELSE 'pi' END, pi_model, hardware, kind,
  severity, title, expected, actual, steps, confirmed, message_ids, status, issue_url FROM findings;
DROP TABLE findings;
ALTER TABLE findings_new RENAME TO findings;
CREATE INDEX findings_ts ON findings (ts);
