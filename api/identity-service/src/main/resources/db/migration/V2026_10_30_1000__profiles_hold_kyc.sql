-- profiles as decided in docs/services/identity/db-identify.md (plan v2, phase 6): the profile holds the KYC result;
-- legal_profiles and the encrypted personal data go. Every database is dev seed data (2026-10-30), so the KYC rows
-- are dropped, not copied: db/seed/R__seed.sql writes the seed ones again.

DROP TABLE legal_profiles;

ALTER TABLE user_profiles RENAME TO profiles;
ALTER TABLE profiles RENAME CONSTRAINT user_profiles_pkey TO profiles_pkey;
ALTER TABLE profiles RENAME CONSTRAINT fk_user_profiles_account TO fk_profiles_account;

-- no screen shows an avatar
ALTER TABLE profiles DROP COLUMN avatar_key;

ALTER TABLE profiles
    ADD COLUMN kyc_verified     boolean     NOT NULL DEFAULT false,
    ADD COLUMN legal_name       varchar(100),
    ADD COLUMN id_number_hash   varchar(64),
    ADD COLUMN id_hash_key_ver  integer,
    ADD COLUMN id_number_masked varchar(12);

-- BR-23: one ID card, one account, whatever pepper version made the hash
ALTER TABLE profiles ADD CONSTRAINT uk_profiles_id_number_hash UNIQUE (id_number_hash);

-- Profile.completeKyc writes the four legal columns together: all null before KYC, all set after it
ALTER TABLE profiles ADD CONSTRAINT ck_profiles_kyc_complete CHECK (
    kyc_verified = (legal_name IS NOT NULL)
    AND kyc_verified = (id_number_hash IS NOT NULL)
    AND kyc_verified = (id_hash_key_ver IS NOT NULL)
    AND kyc_verified = (id_number_masked IS NOT NULL));
