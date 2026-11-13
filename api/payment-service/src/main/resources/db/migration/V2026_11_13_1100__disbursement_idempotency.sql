ALTER TABLE disbursement_requests
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS uk_disbursement_order_idempotency
    ON disbursement_requests (order_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
