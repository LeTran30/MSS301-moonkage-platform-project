-- Plan v2 phase 8b (decision I2): every id column and every column referring to one becomes PostgreSQL uuid.
-- JSON keeps sending ids as strings; ids inside outbox payloads stay text (the contract with the orchestrator).

-- Stop, never repair: a value that is no UUID is corrupt data and must be looked at by hand.
DO $$
DECLARE
    uuid_text CONSTANT text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
    bad bigint;
BEGIN
    SELECT (SELECT count(*) FROM accounts WHERE id !~ uuid_text)
         + (SELECT count(*) FROM profiles WHERE account_id !~ uuid_text)
         + (SELECT count(*) FROM addresses WHERE id !~ uuid_text OR account_id !~ uuid_text)
         + (SELECT count(*) FROM outbox_events WHERE id !~ uuid_text)
    INTO bad;
    IF bad > 0 THEN
        RAISE EXCEPTION '% id value(s) are not UUIDs; fix them by hand before this migration', bad;
    END IF;
END $$;

-- both ends of a foreign key must have the same type, so the keys go first and come back with their names
ALTER TABLE profiles DROP CONSTRAINT fk_profiles_account;
ALTER TABLE addresses DROP CONSTRAINT fk_addresses_account;

-- primary keys and ux_addresses_one_default_per_account are rebuilt by ALTER TYPE under the same names
ALTER TABLE accounts ALTER COLUMN id TYPE uuid USING id::uuid;
ALTER TABLE profiles ALTER COLUMN account_id TYPE uuid USING account_id::uuid;
ALTER TABLE addresses ALTER COLUMN id TYPE uuid USING id::uuid;
ALTER TABLE addresses ALTER COLUMN account_id TYPE uuid USING account_id::uuid;
ALTER TABLE outbox_events ALTER COLUMN id TYPE uuid USING id::uuid;

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_account FOREIGN KEY (account_id) REFERENCES accounts (id);
ALTER TABLE addresses ADD CONSTRAINT fk_addresses_account FOREIGN KEY (account_id) REFERENCES accounts (id);
