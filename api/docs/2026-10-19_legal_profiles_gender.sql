-- identity_db: legal_profiles.sex renamed to gender, the name used by Software Design and the card body.
-- Only for databases created before this change; a fresh database is built by Hibernate (ddl-auto: update).
-- Run ONCE with identity-service STOPPED, before starting the new version:
--   docker compose stop identity-service
--   docker exec -i moonkage-identity-db psql -U <DB_USERNAME> -d identity_db < api/docs/2026-10-19_legal_profiles_gender.sql
--   docker compose up -d --build identity-service

BEGIN;

ALTER TABLE legal_profiles RENAME COLUMN sex TO gender;

COMMIT;
