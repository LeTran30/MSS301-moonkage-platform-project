-- order_db: align with the API/DB outline of 2026-10-22.
-- Decisions: L-05 (no vendor reply to reviews), L-07 (timestamptz), L-09 (checkout session), L-10 (order keeps the
-- acceptance it was created from), L-11 (account ids), L-12 (object keys), L-15 (province codes).
-- vouchers are left as they are (L-13: postponed with FR-13, FR-50).
-- Database review of 2026-10-22 (P-01, P-02, P-06, P-08): docs/architecture/api-db/db-review-proposals.md

-- ---------------------------------------------------------------------------------------------------------------
-- L-11: buyer ids are account ids (D-21)
-- ---------------------------------------------------------------------------------------------------------------
ALTER TABLE cart_items RENAME COLUMN buyer_user_id TO buyer_account_id;
ALTER TABLE cart_items RENAME CONSTRAINT ukrwgrmb22nxir86soca80cakeg TO uk_cart_items_buyer_product;
ALTER TABLE cart_items ADD CONSTRAINT ck_cart_items_quantity CHECK (quantity > 0);

ALTER TABLE orders RENAME COLUMN buyer_user_id TO buyer_account_id;
ALTER TABLE disputes RENAME COLUMN buyer_user_id TO buyer_account_id;

-- ---------------------------------------------------------------------------------------------------------------
-- L-09: a checkout holds what the buyer is paying for until the payment succeeds (FR-09: no order on failure,
-- BR-28: stock held meanwhile). On success it becomes one order per Shop (BR-29).
-- One clock: order-service sets expires_at (the gateway deadline plus a margin) and sends it to vendor-service as
-- the expiry of the stock hold.
--   PENDING_PAYMENT → SUCCEEDED (payment.succeeded: commit the hold, create the orders)
--   PENDING_PAYMENT → FAILED (payment.failed) | EXPIRED (past expires_at): release the hold
--   FAILED | EXPIRED → SUCCEEDED (a late payment.succeeded and the stock could be held again)
--                    | REFUND_REQUESTED (a late payment.succeeded and the stock is gone: refund LATE_PAYMENT)
-- ---------------------------------------------------------------------------------------------------------------
CREATE TABLE checkouts (
    id               varchar(36)  NOT NULL,
    buyer_account_id varchar(36)  NOT NULL,
    recipient_name   varchar(100) NOT NULL,
    recipient_phone  varchar(10)  NOT NULL,
    province_code    varchar(2)   NOT NULL,
    address_detail   varchar(255) NOT NULL,
    invoice_name     varchar(255),
    invoice_tax_code varchar(20),
    invoice_address  varchar(255),
    invoice_email    varchar(255),
    total_amount     bigint       NOT NULL,
    payment_id       varchar(36),
    status           varchar(20)  NOT NULL,
    expires_at       timestamptz  NOT NULL,
    created_at       timestamptz  NOT NULL DEFAULT now(),
    updated_at       timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT checkouts_pkey PRIMARY KEY (id),
    CONSTRAINT ck_checkouts_status
        CHECK (status IN ('PENDING_PAYMENT', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'REFUND_REQUESTED')),
    CONSTRAINT ck_checkouts_total CHECK (total_amount > 0),
    CONSTRAINT ck_checkouts_invoice CHECK (
        (invoice_name IS NULL) = (invoice_tax_code IS NULL)
        AND (invoice_name IS NULL) = (invoice_address IS NULL)
        AND (invoice_name IS NULL) = (invoice_email IS NULL))
);
CREATE INDEX ix_checkouts_buyer ON checkouts (buyer_account_id, created_at);
CREATE INDEX ix_checkouts_pending_expiry ON checkouts (expires_at) WHERE status = 'PENDING_PAYMENT';

-- one group per Shop: its delivery fee and whether it ships interprovince (BR-30, D-14).
-- order_id is fixed when the checkout is created: payment-service allocates the payment to these orders from the
-- start, and a repeated IPN creates the same orders.
CREATE TABLE checkout_groups (
    checkout_id   varchar(36) NOT NULL,
    vendor_id     varchar(36) NOT NULL,
    order_id      varchar(36) NOT NULL,
    items_amount  bigint      NOT NULL,
    shipping_fee  bigint      NOT NULL,
    interprovince boolean     NOT NULL,
    CONSTRAINT checkout_groups_pkey PRIMARY KEY (checkout_id, vendor_id),
    CONSTRAINT uk_checkout_groups_order UNIQUE (order_id),
    CONSTRAINT fk_checkout_groups_checkout FOREIGN KEY (checkout_id) REFERENCES checkouts (id) ON DELETE CASCADE,
    CONSTRAINT ck_checkout_groups_amounts CHECK (items_amount > 0 AND shipping_fee >= 0)
);

-- prices copied at checkout time (BR-19); the price comes from vendor-service when stock is held
CREATE TABLE checkout_lines (
    checkout_id  varchar(36)  NOT NULL,
    line_no      integer      NOT NULL,
    vendor_id    varchar(36)  NOT NULL,
    product_id   varchar(36)  NOT NULL,
    product_name varchar(255) NOT NULL,
    unit_price   bigint       NOT NULL,
    quantity     integer      NOT NULL,
    CONSTRAINT checkout_lines_pkey PRIMARY KEY (checkout_id, line_no),
    CONSTRAINT fk_checkout_lines_group FOREIGN KEY (checkout_id, vendor_id)
        REFERENCES checkout_groups (checkout_id, vendor_id) ON DELETE CASCADE,
    CONSTRAINT uk_checkout_lines_product UNIQUE (checkout_id, product_id),
    CONSTRAINT ck_checkout_lines_values CHECK (unit_price > 0 AND quantity > 0)
);

-- ---------------------------------------------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------------------------------------------
-- L-09: the checkout id is the payment group of BR-29
ALTER TABLE orders RENAME COLUMN checkout_id TO payment_group_id;

-- L-15: delivery address copied into the order
ALTER TABLE orders RENAME COLUMN delivery_area_code TO delivery_province_code;
ALTER TABLE orders ALTER COLUMN delivery_province_code TYPE varchar(2);
ALTER TABLE orders ADD COLUMN recipient_name varchar(100);
ALTER TABLE orders ADD COLUMN recipient_phone varchar(10);

-- FR-24: business invoice data is part of the order
ALTER TABLE orders RENAME COLUMN invoice_legal_name TO invoice_name;
-- L-12
ALTER TABLE orders RENAME COLUMN invoice_file_url TO invoice_object_key;

-- custom orders: remainder (FR-22), agreed delivery (FR-42), and the binding acceptance they came from (L-10)
ALTER TABLE orders ADD COLUMN remaining_amount bigint;
ALTER TABLE orders ADD COLUMN delivery_date date;
ALTER TABLE orders ADD COLUMN delivery_method varchar(100);
ALTER TABLE orders ADD COLUMN agreement_id varchar(36);
ALTER TABLE orders ADD COLUMN agreement_hash char(64);
-- D-13: deadline for disputes, set when the order is delivered
ALTER TABLE orders ADD COLUMN complaint_deadline timestamptz;
-- BR-18: set through POST /internal/orders/{orderId}/payout-lock before payment-service pays the vendor. It is taken on
-- the locked order row, like opening a dispute, so no dispute can open after it.
ALTER TABLE orders ADD COLUMN payout_locked_at timestamptz;
ALTER TABLE orders ADD COLUMN version bigint NOT NULL DEFAULT 0;

ALTER TABLE orders ADD CONSTRAINT ck_orders_amounts CHECK (
    items_amount >= 0 AND shipping_fee >= 0 AND discount_amount >= 0 AND total_amount >= 0
    AND (deposit_amount IS NULL OR deposit_amount >= 0)
    AND (remaining_amount IS NULL OR remaining_amount >= 0));
-- buy-now orders come from a checkout; custom orders from an accepted quote (rows created before this
-- migration are not re-checked)
ALTER TABLE orders ADD CONSTRAINT ck_orders_origin CHECK (
    (kind = 'BUY_NOW' AND payment_group_id IS NOT NULL)
    OR (kind = 'CUSTOM_ORDER' AND quote_id IS NOT NULL AND agreement_id IS NOT NULL
        AND agreement_hash IS NOT NULL AND deposit_amount IS NOT NULL AND remaining_amount IS NOT NULL))
    NOT VALID;
-- AC-32.3: interprovince buy-now orders need a tracking code from SHIPPING on
ALTER TABLE orders ADD CONSTRAINT ck_orders_tracking CHECK (
    NOT (kind = 'BUY_NOW' AND interprovince AND status IN ('SHIPPING', 'DELIVERED', 'COMPLETED')
         AND tracking_code IS NULL))
    NOT VALID;
-- D-13: each kind has its own status path
ALTER TABLE orders ADD CONSTRAINT ck_orders_kind_status CHECK (
    (kind = 'BUY_NOW' AND status IN ('PAID', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'COMPLETED'))
    OR (kind = 'CUSTOM_ORDER' AND status IN ('DEPOSITED', 'AWAITING_MOCKUP_APPROVAL', 'IN_PRODUCTION',
                                            'READY_TO_SHIP', 'DELIVERED', 'COMPLETED')))
    NOT VALID;
-- voucher only on buy-now orders (BR-32)
ALTER TABLE orders ADD CONSTRAINT ck_orders_voucher CHECK (kind = 'BUY_NOW' OR voucher_code IS NULL) NOT VALID;

CREATE INDEX ix_orders_buyer ON orders (buyer_account_id, created_at);
CREATE INDEX ix_orders_vendor ON orders (vendor_id, status);
CREATE INDEX ix_orders_payment_group ON orders (payment_group_id);
CREATE UNIQUE INDEX ux_orders_agreement ON orders (agreement_id) WHERE agreement_id IS NOT NULL;

-- ---------------------------------------------------------------------------------------------------------------
-- children of an order
-- ---------------------------------------------------------------------------------------------------------------
-- L-12: files are object keys
ALTER TABLE mockup_versions RENAME COLUMN file_url TO object_key;
ALTER TABLE progress_update_photos RENAME COLUMN file_url TO object_key;
ALTER TABLE dispute_evidences RENAME COLUMN file_url TO object_key;

-- L-05: vendors do not reply to reviews; rating 1–5; reviews only for delivered buy-now orders (BR-32, service check)
ALTER TABLE reviews DROP COLUMN vendor_reply;
ALTER TABLE reviews DROP COLUMN replied_at;
ALTER TABLE reviews ADD CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders (id);

-- FR-49: who decided; at most one open dispute per order (BR-18)
ALTER TABLE disputes ADD COLUMN decided_by varchar(36);
ALTER TABLE disputes ADD CONSTRAINT ck_disputes_decision CHECK (
    (status = 'OPEN' AND decision IS NULL)
    OR (status = 'RESOLVED' AND decision IS NOT NULL AND decision_reason IS NOT NULL
        AND (decision <> 'PARTIAL_REFUND' OR refund_amount > 0)))
    NOT VALID;
CREATE UNIQUE INDEX ux_disputes_one_open_per_order ON disputes (order_id) WHERE status = 'OPEN';

-- ---------------------------------------------------------------------------------------------------------------
-- copies and messaging
-- ---------------------------------------------------------------------------------------------------------------
-- vendor copy from vendor.updated: BR-22 (no self-dealing), BR-20 (locked vendors)
CREATE TABLE vendor_snapshots (
    vendor_id        varchar(36)  NOT NULL,
    owner_account_id varchar(36)  NOT NULL,
    business_name    varchar(255) NOT NULL,
    status           varchar(20)  NOT NULL,
    can_operate      boolean      NOT NULL,
    source_version   bigint       NOT NULL,
    updated_at       timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT vendor_snapshots_pkey PRIMARY KEY (vendor_id)
);

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
