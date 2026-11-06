-- BE-08b: creating a payment must be idempotent.
--
-- quotation/order call POST /internal/payments over Feign. When the request succeeds on the server but the
-- answer is lost (timeout, flaky network) the client retries: without a key the retry creates a second
-- payment for the same reference, and the buyer is charged twice for one deposit.
--
-- The key is what the caller already knows: the acceptanceId, the checkoutId, the vendorId. The database
-- makes it unique among the payments that are still open, so two concurrent retries still produce one
-- payment. A payment that already failed does not hold the key any more: the payer may start a new attempt.
ALTER TABLE payments ADD COLUMN idempotency_key varchar(64);

CREATE UNIQUE INDEX ux_payments_idempotency_key ON payments (idempotency_key)
    WHERE idempotency_key IS NOT NULL AND status = 'PENDING';
