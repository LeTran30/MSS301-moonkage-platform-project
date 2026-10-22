-- payment_db: align with the API/DB outline of 2026-10-22.
-- Decisions: L-07 (timestamptz), L-08 (a payment is not tied to one order: purpose + reference, allocations,
-- refunds apart), NFR-09 (money integrity), NFR-07 (append-only money journal).
-- Database review of 2026-10-22 (P-01, P-03, P-04, P-08): docs/architecture/api-db/db-review-proposals.md

-- ---------------------------------------------------------------------------------------------------------------
-- refunds are money going out, with their own gateway call and manual fallback (AC-49.3).
-- reason: DISPUTE (FR-49), LATE_PAYMENT (a checkout paid after its stock went back), DUPLICATE_PAYMENT (a second
-- successful payment for the same purpose and reference), QUOTE_EXPIRED (a deposit paid after the quote ran out, FR-19).
-- Only a dispute refund belongs to an order.
-- ---------------------------------------------------------------------------------------------------------------
CREATE TABLE refunds (
    id                  varchar(36)  NOT NULL,
    order_id            varchar(36),
    reason              varchar(30)  NOT NULL,
    dispute_id          varchar(36),
    original_payment_id varchar(255),
    amount              bigint       NOT NULL,
    status              varchar(20)  NOT NULL,
    gateway_refund_ref  varchar(64),
    error               text,
    created_at          timestamptz  NOT NULL DEFAULT now(),
    updated_at          timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT refunds_pkey PRIMARY KEY (id),
    CONSTRAINT fk_refunds_payment FOREIGN KEY (original_payment_id) REFERENCES payments (id),
    CONSTRAINT ck_refunds_amount CHECK (amount > 0),
    CONSTRAINT ck_refunds_status CHECK (status IN ('PENDING', 'SUCCEEDED', 'MANUAL_REQUIRED')),
    CONSTRAINT ck_refunds_reason CHECK (reason IN ('DISPUTE', 'LATE_PAYMENT', 'DUPLICATE_PAYMENT', 'QUOTE_EXPIRED'))
);
-- the automatic refunds happen once per payment
CREATE UNIQUE INDEX ux_refunds_one_per_payment_reason ON refunds (original_payment_id, reason)
    WHERE reason IN ('LATE_PAYMENT', 'DUPLICATE_PAYMENT', 'QUOTE_EXPIRED');
CREATE INDEX ix_refunds_order ON refunds (order_id);
CREATE INDEX ix_refunds_manual ON refunds (created_at) WHERE status = 'MANUAL_REQUIRED';

-- ---------------------------------------------------------------------------------------------------------------
-- L-08: payments
-- ---------------------------------------------------------------------------------------------------------------
ALTER TABLE payments RENAME COLUMN type TO purpose;
ALTER TABLE payments DROP CONSTRAINT payments_type_check;
ALTER TABLE payments RENAME COLUMN transaction_ref TO gateway_txn_ref;

ALTER TABLE payments ADD COLUMN reference_id varchar(36);
ALTER TABLE payments ADD COLUMN payer_account_id varchar(36);
ALTER TABLE payments ADD COLUMN gateway_txn_no varchar(64);
ALTER TABLE payments ADD COLUMN gateway_response_code varchar(10);
ALTER TABLE payments ADD COLUMN expires_at timestamptz;
ALTER TABLE payments ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- old REFUND rows (dev only) move to refunds; they never recorded which payment they refunded
INSERT INTO refunds (id, order_id, reason, original_payment_id, amount, status, created_at, updated_at)
SELECT id, order_id, 'DISPUTE', NULL, amount,
       CASE status WHEN 'SUCCEEDED' THEN 'SUCCEEDED' WHEN 'FAILED' THEN 'MANUAL_REQUIRED' ELSE 'PENDING' END,
       coalesce(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', now()), now()
FROM payments
WHERE purpose = 'REFUND';

UPDATE payments SET purpose = 'CHECKOUT' WHERE purpose = 'BUY_NOW';
UPDATE payments SET purpose = 'REMAINDER' WHERE purpose = 'REMAINING';
-- before this migration every payment belonged to one order
UPDATE payments SET reference_id = order_id;

ALTER TABLE payments ADD CONSTRAINT ck_payments_purpose
    CHECK (purpose IN ('CHECKOUT', 'DEPOSIT', 'REMAINDER', 'REGISTRATION_FEE', 'REFUND')) NOT VALID;

-- ---------------------------------------------------------------------------------------------------------------
-- L-08: a CHECKOUT payment is split over the orders it created (BR-29)
-- ---------------------------------------------------------------------------------------------------------------
CREATE TABLE payment_allocations (
    payment_id varchar(255) NOT NULL,
    order_id   varchar(36)  NOT NULL,
    amount     bigint       NOT NULL,
    CONSTRAINT payment_allocations_pkey PRIMARY KEY (payment_id, order_id),
    CONSTRAINT fk_payment_allocations_payment FOREIGN KEY (payment_id) REFERENCES payments (id),
    CONSTRAINT ck_payment_allocations_amount CHECK (amount > 0)
);
CREATE INDEX ix_payment_allocations_order ON payment_allocations (order_id);

INSERT INTO payment_allocations (payment_id, order_id, amount)
SELECT id, order_id, amount
FROM payments
WHERE status = 'SUCCEEDED' AND purpose IN ('CHECKOUT', 'DEPOSIT', 'REMAINDER') AND amount > 0;

-- the REFUND rows are now in refunds; payments keep only money coming in
DELETE FROM payments WHERE purpose = 'REFUND';
-- every refund from now on names the payment it returns money from (rows moved above are not re-checked)
ALTER TABLE refunds ADD CONSTRAINT ck_refunds_original_payment CHECK (original_payment_id IS NOT NULL) NOT VALID;
-- a dispute refund names its order and dispute (rows moved above have no dispute and are not re-checked)
ALTER TABLE refunds ADD CONSTRAINT ck_refunds_dispute
    CHECK (reason <> 'DISPUTE' OR (order_id IS NOT NULL AND dispute_id IS NOT NULL)) NOT VALID;
ALTER TABLE payments DROP CONSTRAINT ck_payments_purpose;
ALTER TABLE payments ADD CONSTRAINT ck_payments_purpose
    CHECK (purpose IN ('CHECKOUT', 'DEPOSIT', 'REMAINDER', 'REGISTRATION_FEE'));

ALTER TABLE payments DROP COLUMN order_id;
ALTER TABLE payments ALTER COLUMN reference_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN purpose TYPE varchar(20);
ALTER TABLE payments ADD CONSTRAINT ck_payments_amount CHECK (amount > 0);
-- BR-25: one gateway reference per payment, so a repeated IPN cannot record money twice
ALTER TABLE payments ADD CONSTRAINT uk_payments_gateway_txn_ref UNIQUE (gateway_txn_ref);
-- one successful payment per purpose and reference (one checkout, deposit, remainder, registration fee). A second
-- one the gateway still took (two tabs, a late IPN) is kept as DUPLICATE, refunded (DUPLICATE_PAYMENT) and not
-- announced as payment.succeeded. Two IPNs racing: the loser hits the index and is recorded as DUPLICATE.
ALTER TABLE payments DROP CONSTRAINT payments_status_check;
ALTER TABLE payments ADD CONSTRAINT ck_payments_status
    CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'DUPLICATE'));
CREATE UNIQUE INDEX ux_payments_one_success ON payments (purpose, reference_id) WHERE status = 'SUCCEEDED';
CREATE INDEX ix_payments_reference ON payments (purpose, reference_id);
CREATE INDEX ix_payments_pending_expiry ON payments (expires_at) WHERE status = 'PENDING';

-- ---------------------------------------------------------------------------------------------------------------
-- ledgers: one per order. total_collected = what the buyer paid; NFR-09 holds in the database
-- ---------------------------------------------------------------------------------------------------------------
ALTER TABLE ledgers ADD COLUMN vendor_id varchar(36);
ALTER TABLE ledgers ADD COLUMN total_collected bigint NOT NULL DEFAULT 0;
UPDATE ledgers SET total_collected = held + disbursed + refunded + paid_out;
UPDATE ledgers SET version = 0 WHERE version IS NULL;
ALTER TABLE ledgers ALTER COLUMN version SET NOT NULL;
ALTER TABLE ledgers ALTER COLUMN version SET DEFAULT 0;
ALTER TABLE ledgers RENAME CONSTRAINT uk12xlk60ch84r6rrocyhofv145 TO uk_ledgers_order;
ALTER TABLE ledgers ADD CONSTRAINT ck_ledgers_non_negative CHECK (
    total_collected >= 0 AND held >= 0 AND disbursed >= 0 AND refunded >= 0 AND paid_out >= 0);
-- held is what is left of what was collected (NFR-09); with held >= 0 nothing goes out that did not come in
ALTER TABLE ledgers ADD CONSTRAINT ck_ledgers_balance
    CHECK (held = total_collected - disbursed - refunded - paid_out);
CREATE INDEX ix_ledgers_vendor ON ledgers (vendor_id);

-- every money movement of an order, insert only (NFR-07, NFR-09); ledgers holds the running totals
CREATE TABLE ledger_entries (
    id               varchar(36) NOT NULL,
    order_id         varchar(36) NOT NULL,
    kind             varchar(20) NOT NULL,
    amount           bigint      NOT NULL,
    reference_id     varchar(36),
    actor_account_id varchar(36),
    created_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ledger_entries_pkey PRIMARY KEY (id),
    CONSTRAINT ck_ledger_entries_kind CHECK (kind IN ('COLLECT', 'DISBURSE', 'REFUND', 'PAYOUT')),
    CONSTRAINT ck_ledger_entries_amount CHECK (amount > 0)
);
CREATE INDEX ix_ledger_entries_order ON ledger_entries (order_id, created_at);

CREATE FUNCTION forbid_ledger_entry_change() RETURNS trigger
    LANGUAGE plpgsql AS
$$
BEGIN
    RAISE EXCEPTION 'ledger_entries is append-only';
END
$$;
CREATE TRIGGER tg_ledger_entries_append_only
    BEFORE UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION forbid_ledger_entry_change();

-- ledgers written before this migration get entries that add up to them
INSERT INTO ledger_entries (id, order_id, kind, amount, created_at)
SELECT gen_random_uuid()::text, l.order_id, e.kind, e.amount, now()
FROM ledgers l
CROSS JOIN LATERAL (VALUES ('COLLECT', l.total_collected), ('DISBURSE', l.disbursed),
                           ('REFUND', l.refunded), ('PAYOUT', l.paid_out)) AS e(kind, amount)
WHERE e.amount > 0;

-- NFR-09: a ledger is the sum of its entries. Checked at commit, so a transaction may write either table first; every
-- change to a ledger inserts its entry in the same transaction.
CREATE FUNCTION check_ledger_matches_entries() RETURNS trigger
    LANGUAGE plpgsql AS
$$
DECLARE
    l ledgers%ROWTYPE;
    s record;
BEGIN
    SELECT * INTO l FROM ledgers WHERE order_id = NEW.order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ledger entry for order % has no ledger', NEW.order_id;
    END IF;
    SELECT coalesce(sum(amount) FILTER (WHERE kind = 'COLLECT'), 0)  AS collected,
           coalesce(sum(amount) FILTER (WHERE kind = 'DISBURSE'), 0) AS disbursed,
           coalesce(sum(amount) FILTER (WHERE kind = 'REFUND'), 0)   AS refunded,
           coalesce(sum(amount) FILTER (WHERE kind = 'PAYOUT'), 0)   AS paid_out
    INTO s FROM ledger_entries WHERE order_id = NEW.order_id;
    IF (l.total_collected, l.disbursed, l.refunded, l.paid_out)
       IS DISTINCT FROM (s.collected, s.disbursed, s.refunded, s.paid_out) THEN
        RAISE EXCEPTION 'ledger of order % does not match its entries', NEW.order_id;
    END IF;
    RETURN NULL;
END
$$;
CREATE CONSTRAINT TRIGGER tg_ledgers_match_entries
    AFTER INSERT OR UPDATE ON ledgers DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_ledger_matches_entries();
CREATE CONSTRAINT TRIGGER tg_ledger_entries_match_ledger
    AFTER INSERT ON ledger_entries DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_ledger_matches_entries();

-- ---------------------------------------------------------------------------------------------------------------
-- BR-29: a successful payment is split exactly over its orders (order ids come from the checkout); a registration fee
-- has no order. Checked at commit.
-- ---------------------------------------------------------------------------------------------------------------
CREATE FUNCTION assert_payment_allocated(p_id varchar) RETURNS void
    LANGUAGE plpgsql AS
$$
DECLARE
    p payments%ROWTYPE;
    allocated bigint;
BEGIN
    SELECT * INTO p FROM payments WHERE id = p_id;
    IF NOT FOUND OR p.status <> 'SUCCEEDED' THEN RETURN; END IF;
    SELECT coalesce(sum(amount), 0) INTO allocated FROM payment_allocations WHERE payment_id = p_id;
    IF p.purpose = 'REGISTRATION_FEE' AND allocated <> 0 THEN
        RAISE EXCEPTION 'registration fee payment % must not be allocated to orders', p_id;
    ELSIF p.purpose <> 'REGISTRATION_FEE' AND allocated <> p.amount THEN
        RAISE EXCEPTION 'payment % allocates % of %', p_id, allocated, p.amount;
    END IF;
END
$$;
CREATE FUNCTION check_payment_allocated() RETURNS trigger
    LANGUAGE plpgsql AS
$$
BEGIN
    IF TG_TABLE_NAME = 'payments' THEN
        PERFORM assert_payment_allocated(NEW.id);
    ELSE
        PERFORM assert_payment_allocated(coalesce(NEW.payment_id, OLD.payment_id));
    END IF;
    RETURN NULL;
END
$$;
CREATE CONSTRAINT TRIGGER tg_payments_allocated
    AFTER INSERT OR UPDATE OF status, amount ON payments DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_payment_allocated();
CREATE CONSTRAINT TRIGGER tg_payment_allocations_sum
    AFTER INSERT OR UPDATE OR DELETE ON payment_allocations DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_payment_allocated();

-- ---------------------------------------------------------------------------------------------------------------
-- disbursements and payouts
-- ---------------------------------------------------------------------------------------------------------------
ALTER TABLE disbursement_requests ADD COLUMN vendor_id varchar(36);
ALTER TABLE disbursement_requests ADD COLUMN decided_by varchar(36);
ALTER TABLE disbursement_requests ADD CONSTRAINT ck_disbursement_requests_amounts CHECK (
    amount > 0 AND (approved_amount IS NULL OR (approved_amount > 0 AND approved_amount <= amount)));
-- FR-47: a rejection carries its reason
ALTER TABLE disbursement_requests ADD CONSTRAINT ck_disbursement_requests_reason
    CHECK (status <> 'REJECTED' OR (reason IS NOT NULL AND btrim(reason) <> '')) NOT VALID;
CREATE INDEX ix_disbursement_requests_order ON disbursement_requests (order_id, status);

-- FR-48: one payout per order, approved by an admin (A-12: bookkeeping only)
CREATE TABLE payouts (
    id          varchar(36) NOT NULL,
    order_id    varchar(36) NOT NULL,
    vendor_id   varchar(36) NOT NULL,
    amount      bigint      NOT NULL,
    approved_by varchar(36) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT payouts_pkey PRIMARY KEY (id),
    CONSTRAINT uk_payouts_order UNIQUE (order_id),
    CONSTRAINT ck_payouts_amount CHECK (amount >= 0)
);

-- ---------------------------------------------------------------------------------------------------------------
-- copies and messaging
-- ---------------------------------------------------------------------------------------------------------------
-- order copy from order-service events: payout eligibility (AC-48.1, AC-48.5)
CREATE TABLE order_snapshots (
    order_id           varchar(36) NOT NULL,
    vendor_id          varchar(36) NOT NULL,
    kind               varchar(20) NOT NULL,
    interprovince      boolean     NOT NULL,
    total_amount       bigint      NOT NULL,
    status             varchar(30) NOT NULL,
    complaint_deadline timestamptz,
    received_confirmed boolean     NOT NULL DEFAULT false,
    dispute_open       boolean     NOT NULL DEFAULT false,
    source_version     bigint      NOT NULL,
    updated_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT order_snapshots_pkey PRIMARY KEY (order_id)
);
CREATE INDEX ix_order_snapshots_payout ON order_snapshots (complaint_deadline) WHERE NOT dispute_open;

CREATE TABLE processed_events (
    event_id     varchar(64)  NOT NULL,
    routing_key  varchar(100) NOT NULL,
    processed_at timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT processed_events_pkey PRIMARY KEY (event_id)
);

CREATE TABLE outbox_events (
    id           varchar(255) NOT NULL,
    created_at   timestamptz  NOT NULL,
    updated_at   timestamptz  NOT NULL,
    attempts     integer      NOT NULL,
    payload      text         NOT NULL,
    published_at timestamptz,
    routing_key  varchar(100) NOT NULL,
    CONSTRAINT outbox_events_pkey PRIMARY KEY (id)
);
-- the publisher only looks for unpublished rows, oldest first
CREATE INDEX ix_outbox_events_unpublished ON outbox_events (created_at) WHERE published_at IS NULL;

-- ---------------------------------------------------------------------------------------------------------------
-- L-07: every point in time is timestamptz (containers run TZ=Asia/Ho_Chi_Minh)
-- ---------------------------------------------------------------------------------------------------------------
DO $$
DECLARE
    c record;
BEGIN
    FOR c IN SELECT table_name, column_name
             FROM information_schema.columns
             WHERE table_schema = 'public'
               AND data_type = 'timestamp without time zone'
               AND table_name <> 'flyway_schema_history'
    LOOP
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE timestamptz USING %I AT TIME ZONE %L',
                       c.table_name, c.column_name, c.column_name, 'Asia/Ho_Chi_Minh');
    END LOOP;
END $$;
