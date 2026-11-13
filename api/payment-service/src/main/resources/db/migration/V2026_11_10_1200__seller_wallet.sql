-- payment_db: the Shop owner's wallet. A completed order is paid out to it at once (no commission), and an approved
-- deposit advance too; the owner withdraws to a bank like a buyer does.
-- SALE: credit, reference = orderId. DISBURSEMENT: credit, reference = disbursement request id.
ALTER TABLE wallet_entries DROP CONSTRAINT ck_wallet_entries_reason;
ALTER TABLE wallet_entries ADD CONSTRAINT ck_wallet_entries_reason
    CHECK (reason IN ('ORDER_REJECTED', 'PAYMENT', 'REFUND', 'WITHDRAWAL', 'WITHDRAWAL_RETURNED', 'SALE',
                      'DISBURSEMENT'));
