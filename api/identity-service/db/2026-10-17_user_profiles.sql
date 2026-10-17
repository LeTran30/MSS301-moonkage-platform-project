-- identity_db: users -> user_profiles, addresses/vendors keyed by account id (Software Design D-21).
-- Only for databases created before this change; a fresh database is built by Hibernate (ddl-auto: update).
-- Run ONCE with identity-service STOPPED, before starting the new version:
--   docker compose stop identity-service
--   docker exec -i moonkage-identity-db psql -U <DB_USERNAME> -d identity_db < api/identity-service/db/2026-10-17_user_profiles.sql
--   docker compose up -d --build identity-service
-- Ids of accounts, addresses and vendors are kept, so vendorId references in other services stay valid.

BEGIN;

-- login identifiers live only on accounts: copy a phone that existed only on the profile (if not taken)
UPDATE accounts a
SET phone_number = u.phone_number
FROM users u
WHERE u.account_id = a.id
  AND a.phone_number IS NULL
  AND u.phone_number IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM accounts x WHERE x.phone_number = u.phone_number);

-- addresses.user_id -> account_id
ALTER TABLE addresses ADD COLUMN account_id varchar(255);
UPDATE addresses ad SET account_id = u.account_id FROM users u WHERE u.id = ad.user_id;
ALTER TABLE addresses ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE addresses DROP COLUMN user_id; -- drops its FK to users
ALTER TABLE addresses ADD CONSTRAINT fk_addresses_account FOREIGN KEY (account_id) REFERENCES accounts (id);

-- vendors.owner_user_id -> owner_account_id
ALTER TABLE vendors ADD COLUMN owner_account_id varchar(255);
UPDATE vendors v SET owner_account_id = u.account_id FROM users u WHERE u.id = v.owner_user_id;
ALTER TABLE vendors ALTER COLUMN owner_account_id SET NOT NULL;
ALTER TABLE vendors DROP COLUMN owner_user_id; -- drops its FK and unique constraint
ALTER TABLE vendors ADD CONSTRAINT uk_vendors_owner_account UNIQUE (owner_account_id);
ALTER TABLE vendors ADD CONSTRAINT fk_vendors_owner_account FOREIGN KEY (owner_account_id) REFERENCES accounts (id);

-- users -> user_profiles, primary key = account_id, no email/phone
ALTER TABLE users RENAME TO user_profiles;
ALTER TABLE user_profiles DROP COLUMN id;            -- drops users_pkey
ALTER TABLE user_profiles DROP COLUMN email;
ALTER TABLE user_profiles DROP COLUMN phone_number;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (account_id);

COMMIT;
