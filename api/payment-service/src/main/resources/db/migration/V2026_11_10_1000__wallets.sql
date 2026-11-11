-- payment_db: the buyer's wallet (Q-01). Money a Shop rejects comes back here instead of the card, and the buyer can
-- pay a checkout from it. Same rules as ledgers: entries are insert only and the balance is their sum (NFR-07, NFR-09).

CREATE TABLE wallets (
    account_id varchar(36) NOT NULL,
    balance    bigint      NOT NULL DEFAULT 0,
    version    bigint      NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT wallets_pkey PRIMARY KEY (account_id),
    CONSTRAINT ck_wallets_balance CHECK (balance >= 0)
);

-- reason ORDER_REJECTED: credit, reference = orderId. PAYMENT: debit, reference = paymentId.
CREATE TABLE wallet_entries (
    id           varchar(36) NOT NULL,
    account_id   varchar(36) NOT NULL,
    kind         varchar(10) NOT NULL,
    reason       varchar(30) NOT NULL,
    amount       bigint      NOT NULL,
    reference_id varchar(36) NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT wallet_entries_pkey PRIMARY KEY (id),
    CONSTRAINT fk_wallet_entries_wallet FOREIGN KEY (account_id) REFERENCES wallets (account_id),
    CONSTRAINT ck_wallet_entries_kind CHECK (kind IN ('CREDIT', 'DEBIT')),
    CONSTRAINT ck_wallet_entries_reason CHECK (reason IN ('ORDER_REJECTED', 'PAYMENT')),
    CONSTRAINT ck_wallet_entries_amount CHECK (amount > 0),
    -- one refund per rejected order, one debit per payment, however often an event is delivered
    CONSTRAINT uk_wallet_entries_reason_reference UNIQUE (reason, reference_id)
);
CREATE INDEX ix_wallet_entries_account ON wallet_entries (account_id, created_at DESC);

CREATE FUNCTION forbid_wallet_entry_change() RETURNS trigger
    LANGUAGE plpgsql AS
$$
BEGIN
    RAISE EXCEPTION 'wallet_entries is append-only';
END
$$;
CREATE TRIGGER tg_wallet_entries_append_only
    BEFORE UPDATE OR DELETE ON wallet_entries
    FOR EACH ROW EXECUTE FUNCTION forbid_wallet_entry_change();

-- a wallet is the sum of its entries, checked at commit like ledgers
CREATE FUNCTION check_wallet_matches_entries() RETURNS trigger
    LANGUAGE plpgsql AS
$$
DECLARE
    w   wallets%ROWTYPE;
    sum bigint;
BEGIN
    SELECT * INTO w FROM wallets WHERE account_id = NEW.account_id;
    SELECT coalesce(sum(CASE kind WHEN 'CREDIT' THEN amount ELSE -amount END), 0)
    INTO sum FROM wallet_entries WHERE account_id = NEW.account_id;
    IF w.balance IS DISTINCT FROM sum THEN
        RAISE EXCEPTION 'wallet of account % does not match its entries', NEW.account_id;
    END IF;
    RETURN NULL;
END
$$;
CREATE CONSTRAINT TRIGGER tg_wallets_match_entries
    AFTER INSERT OR UPDATE ON wallets DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_wallet_matches_entries();
CREATE CONSTRAINT TRIGGER tg_wallet_entries_match_wallet
    AFTER INSERT ON wallet_entries DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_wallet_matches_entries();
