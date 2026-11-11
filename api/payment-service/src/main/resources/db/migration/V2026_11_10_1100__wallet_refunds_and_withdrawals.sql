-- payment_db: the rest of the buyer's wallet (Q-01).
-- REFUND: a refund of a payment made from the wallet goes back to the wallet, not to VNPay (reference = refundId).
-- WITHDRAWAL: the buyer asks to send money to their bank; it leaves the wallet at once (reference = withdrawalId).
-- WITHDRAWAL_RETURNED: an admin refused that request, so the money comes back (reference = withdrawalId).
ALTER TABLE wallet_entries DROP CONSTRAINT ck_wallet_entries_reason;
ALTER TABLE wallet_entries ADD CONSTRAINT ck_wallet_entries_reason
    CHECK (reason IN ('ORDER_REJECTED', 'PAYMENT', 'REFUND', 'WITHDRAWAL', 'WITHDRAWAL_RETURNED'));

-- A request to send wallet money to a bank account. An admin makes the transfer by hand and then marks it COMPLETED,
-- or REJECTED with a reason (the money goes back to the wallet). The bank comes from the VietQR list (bin + name).
CREATE TABLE withdrawals (
    id             varchar(36)  NOT NULL,
    account_id     varchar(36)  NOT NULL,
    amount         bigint       NOT NULL,
    bank_bin       varchar(10)  NOT NULL,
    bank_name      varchar(255) NOT NULL,
    account_number varchar(30)  NOT NULL,
    account_name   varchar(100) NOT NULL,
    status         varchar(20)  NOT NULL,
    reject_reason  text,
    reviewed_by    varchar(36),
    reviewed_at    timestamptz,
    created_at     timestamptz  NOT NULL DEFAULT now(),
    updated_at     timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT withdrawals_pkey PRIMARY KEY (id),
    CONSTRAINT fk_withdrawals_wallet FOREIGN KEY (account_id) REFERENCES wallets (account_id),
    CONSTRAINT ck_withdrawals_amount CHECK (amount > 0),
    CONSTRAINT ck_withdrawals_status CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED')),
    CONSTRAINT ck_withdrawals_reviewed CHECK (status = 'PENDING' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
    CONSTRAINT ck_withdrawals_reject_reason CHECK (status <> 'REJECTED' OR reject_reason IS NOT NULL)
);
CREATE INDEX ix_withdrawals_account ON withdrawals (account_id, created_at DESC);
CREATE INDEX ix_withdrawals_pending ON withdrawals (created_at) WHERE status = 'PENDING';
