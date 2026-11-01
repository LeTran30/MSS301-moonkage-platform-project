-- accounts as decided in docs/services/identity/db-identify.md (stage 2 of domain-model-plan.md). The database repeats
-- the rules the Account entity already keeps, as the last line against SQL written by hand, seeds and bugs.

-- the NFC attempt counter and lockout only matter while a lockout runs: kyc keeps them in memory now
ALTER TABLE accounts DROP COLUMN nfc_failed_attempts;
ALTER TABLE accounts DROP COLUMN nfc_locked_until;

-- readable names instead of the ones Hibernate generated in V1
ALTER TABLE addresses RENAME CONSTRAINT fkaf33clpk1s4svpok3x9egrvji TO fk_addresses_account;
ALTER TABLE legal_profiles RENAME CONSTRAINT fkg2lxqf696r5mtube9hn0olhwl TO fk_legal_profiles_account;
ALTER TABLE user_profiles RENAME CONSTRAINT fkm9xh4i2a8u1nei2w5nlqrmb2g TO fk_user_profiles_account;

-- Role names are short; the CHECK of V1 still lists them
ALTER TABLE accounts ALTER COLUMN role TYPE varchar(10);

-- PhoneNumber.value: the 9 subscriber digits. A row still in the national form 0xxxxxxxxx (skipped by
-- V2026_10_26_1000 because its 9-digit form was taken) makes this migration stop here: fix that row by hand first.
ALTER TABLE accounts ALTER COLUMN phone_number TYPE varchar(9);
ALTER TABLE accounts ADD CONSTRAINT ck_accounts_phone_number CHECK (phone_number ~ '^[35789][0-9]{8}$');

-- Email.value is trimmed and lower case; login looks it up the same way
ALTER TABLE accounts ADD CONSTRAINT ck_accounts_email_lower CHECK (email = lower(email));
