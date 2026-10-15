-- Native apps (CleanJibe's iPhone app) prove they are genuine with Apple App Attest. One row per
-- attested app key: its public key and assertion counter, to check later requests and count the
-- daily budget per device. An anonymous device key, not linked to a person; deleted 30 days after
-- its last use.
CREATE TABLE attest_keys (
  key_id     TEXT PRIMARY KEY,   -- base64 SHA-256 of the key's public point (Apple's keyId)
  site       TEXT NOT NULL,
  bundle_id  TEXT NOT NULL,
  env        TEXT NOT NULL CHECK (env IN ('production', 'development')),
  public_key TEXT NOT NULL,      -- SPKI, base64
  counter    INTEGER NOT NULL,
  created    INTEGER NOT NULL,
  last_used  INTEGER NOT NULL
);

-- One-time challenges for /attest and /token, valid 5 minutes.
CREATE TABLE attest_challenges (
  challenge TEXT PRIMARY KEY,    -- base64url
  site      TEXT NOT NULL,
  expires   INTEGER NOT NULL
);
