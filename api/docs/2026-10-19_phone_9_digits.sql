-- identity_db: phone numbers stored as the 9 subscriber digits (AC-01.3), not 0xxxxxxxxx any more, so register,
-- login and duplicate checks agree (Account.storedPhoneNumber).
-- Only for databases created before this change. Run ONCE with identity-service STOPPED:
--   docker compose stop identity-service
--   docker cp api/docs/2026-10-19_phone_9_digits.sql moonkage-identity-db:/tmp/phone_9_digits.sql
--   docker exec moonkage-identity-db psql -U <DB_USERNAME> -d identity_db -f /tmp/phone_9_digits.sql
-- Safe to run again: a number already 9 digits long is left as it is.

\set ON_ERROR_STOP on

BEGIN;

-- 0912… and 84912… of the same person would collide on the unique key: stop and let a human pick one
DO $$
BEGIN
    IF EXISTS (SELECT RIGHT(phone_number, 9)
               FROM accounts
               WHERE phone_number IS NOT NULL
               GROUP BY RIGHT(phone_number, 9)
               HAVING COUNT(*) > 1) THEN
        RAISE EXCEPTION 'two accounts hold the same phone number in different forms: resolve them first';
    END IF;
END $$;

UPDATE accounts
SET phone_number = RIGHT(phone_number, 9)
WHERE phone_number IS NOT NULL AND length(phone_number) > 9;

COMMIT;
