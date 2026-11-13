-- BR-09: early disbursement may consume only DEPOSIT money. Remainder and
-- checkout collections remain held until the final payout (FR-48).
ALTER TABLE ledgers
    ADD COLUMN deposit_collected bigint NOT NULL DEFAULT 0;

-- Backfill from successful payment allocations. GREATEST preserves historical
-- ledgers that already disbursed deposit money before this column existed.
UPDATE ledgers l
SET deposit_collected = GREATEST(
        l.disbursed,
        COALESCE((
            SELECT SUM(a.amount)
            FROM payment_allocations a
            JOIN payments p ON p.id = a.payment_id
            WHERE a.order_id = l.order_id
              AND p.purpose = 'DEPOSIT'
              AND p.status = 'SUCCEEDED'
        ), 0));

ALTER TABLE ledgers
    ADD CONSTRAINT ck_ledgers_deposit_collected
        CHECK (deposit_collected >= 0
            AND deposit_collected <= total_collected
            AND disbursed <= deposit_collected);
