-- identity_db: accounts.status removed (Q-15). Per Requirement 7.1 an account is only e-mail confirmed or not
-- (accounts.account_verified) and NFC verified or not (legal_profiles); there is no admin lock of an account.
-- Only for databases created before this change; a fresh database is built by Hibernate (ddl-auto: update).
-- Run ONCE with identity-service STOPPED, before starting the new version: the column is NOT NULL and the new
-- code no longer writes it, so every registration would fail while it exists.
--   docker compose stop identity-service
--   docker cp api/docs/2026-10-19_drop_account_status.sql moonkage-identity-db:/tmp/drop_status.sql
--   docker exec moonkage-identity-db psql -U <DB_USERNAME> -d identity_db -f /tmp/drop_status.sql
--   docker compose up -d --build identity-service

\set ON_ERROR_STOP on

BEGIN;

-- nothing in the code ever set BANNED, and INACTIVE always went with account_verified = false.
-- Stop instead of losing information if a row says otherwise.
DO $$
BEGIN
    IF EXISTS (SELECT 1
               FROM accounts
               WHERE status = 'BANNED'
                  OR (status = 'INACTIVE') <> (NOT account_verified)) THEN
        RAISE EXCEPTION 'accounts.status disagrees with account_verified on some rows: check them first';
    END IF;
END $$;

ALTER TABLE accounts DROP COLUMN status;

COMMIT;
