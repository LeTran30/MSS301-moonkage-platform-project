-- identity-service no longer records when an ID card was verified and answers nfcVerifiedAt = null (identity refactor,
-- decision G1). Checks made from now on have no such moment; older rows keep theirs.
ALTER TABLE vendor_owner_checks ALTER COLUMN nfc_verified_at DROP NOT NULL;
