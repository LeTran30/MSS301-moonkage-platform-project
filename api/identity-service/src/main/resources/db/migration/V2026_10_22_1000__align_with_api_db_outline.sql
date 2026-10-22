-- identity_db: align with the API/DB outline of 2026-10-22 (decisions L-06, L-12, L-15).
-- NFC sessions and OTP codes stay in the service's memory (L-06): no table here.
-- Database review of 2026-10-22 (P-08): docs/architecture/api-db/db-review-proposals.md

-- L-12: files are stored as MinIO object keys, never as URLs
ALTER TABLE user_profiles RENAME COLUMN avatar_url TO avatar_key;

-- L-15: delivery areas are provinces (Q-12); the ward code is no longer used. ward_name stays as display text.
ALTER TABLE addresses DROP COLUMN ward_code;

-- FR-03 (AC-03.1): at most one default address per account
CREATE UNIQUE INDEX ux_addresses_one_default_per_account ON addresses (account_id) WHERE is_default;

-- the publisher only looks for unpublished rows, oldest first
DROP INDEX ix_outbox_events_unpublished;
CREATE INDEX ix_outbox_events_unpublished ON outbox_events (created_at) WHERE published_at IS NULL;
