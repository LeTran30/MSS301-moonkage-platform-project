-- identity_db: demo seller account (MEMBER, e-mail confirmed). Local dev / demo only, never production.
-- How to run: api/docs/seed/README.md. Needs identity-service started once (Hibernate created the tables).
-- Variables (psql -v):
--   seller_password  required; not stored in the repository
--   seller_email     optional, default seller@moonkage.vn
-- Safe to run again: an existing account with this e-mail is left as it is.

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

\if :{?seller_password}
\else
  \echo 'Missing password: run with  -v seller_password=...  (see api/docs/seed/README.md)'
  \quit
\endif
\if :{?seller_email}
\else
  \set seller_email seller@moonkage.vn
\endif

-- bcrypt in SQL; Spring's BCryptPasswordEncoder reads the $2a$ hashes pgcrypto makes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

INSERT INTO accounts (id, email, phone_number, password_hash, role, account_verified,
                      nfc_failed_attempts, created_at, updated_at)
VALUES (gen_random_uuid()::text, :'seller_email',
        '901234567',                                   -- 0901234567, stored as the 9 subscriber digits
        crypt(:'seller_password', gen_salt('bf', 10)),
        'MEMBER', true, 0, now(), now())
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (account_id, full_name, created_at, updated_at)
SELECT id, 'Nguyễn Văn Bánh', now(), now()
FROM accounts
WHERE email = :'seller_email'
ON CONFLICT (account_id) DO NOTHING;

COMMIT;

-- the id step 2 needs
SELECT id AS seller_account_id FROM accounts WHERE email = :'seller_email';
