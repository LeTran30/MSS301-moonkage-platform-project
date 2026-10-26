-- One stored form for every phone number: the 9 subscriber digits (PhoneNumber.value, AC-01.3).
-- addresses.recipient_phone held the national form 0xxxxxxxxx until now.
UPDATE addresses
SET recipient_phone = substring(recipient_phone FROM 2)
WHERE recipient_phone ~ '^0[35789][0-9]{8}$';

-- accounts.phone_number was always 9 digits; a row written in the national form by an interim build is aligned too,
-- unless the 9-digit form is already taken (uk_accounts_phone_number)
UPDATE accounts a
SET phone_number = substring(a.phone_number FROM 2)
WHERE a.phone_number ~ '^0[35789][0-9]{8}$'
  AND NOT EXISTS (SELECT 1 FROM accounts b WHERE b.phone_number = substring(a.phone_number FROM 2));
