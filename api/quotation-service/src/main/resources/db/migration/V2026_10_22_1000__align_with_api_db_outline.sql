-- quotation_db: align with the API/DB outline of 2026-10-22.
-- Decisions: L-07 (timestamptz), L-10 (quote lines, revisions, binding acceptance snapshot; accepted for now),
-- L-11 (Requirement names: request / quote, account ids), L-12 (object keys), L-15 (province codes).
-- Database review of 2026-10-22 (P-08): docs/architecture/api-db/db-review-proposals.md

-- ---------------------------------------------------------------------------------------------------------------
-- L-11: tender_* become the Requirement's names
-- ---------------------------------------------------------------------------------------------------------------
ALTER TABLE tender_requests RENAME TO quote_requests;
ALTER TABLE quote_requests RENAME CONSTRAINT tender_requests_pkey TO quote_requests_pkey;
ALTER TABLE quote_requests RENAME CONSTRAINT tender_requests_status_check TO quote_requests_status_check;
ALTER TABLE quote_requests RENAME CONSTRAINT tender_requests_type_check TO quote_requests_type_check;
ALTER TABLE quote_requests RENAME COLUMN buyer_user_id TO buyer_account_id;

ALTER TABLE tender_invitations RENAME TO request_invitations;
ALTER TABLE request_invitations RENAME CONSTRAINT tender_invitations_pkey TO request_invitations_pkey;
ALTER TABLE request_invitations RENAME CONSTRAINT tender_invitations_status_check TO request_invitations_status_check;
ALTER TABLE request_invitations RENAME CONSTRAINT ukee3dv4k999039hukckbrb0gq8 TO uk_request_invitations_vendor;
ALTER TABLE request_invitations RENAME COLUMN tender_request_id TO request_id;
-- AC-36.3: a decline always carries its reason
ALTER TABLE request_invitations ADD CONSTRAINT ck_request_invitations_decline
    CHECK (status <> 'DECLINED' OR (decline_reason IS NOT NULL AND btrim(decline_reason) <> ''));

ALTER TABLE tender_request_custom_types RENAME TO request_custom_types;
ALTER TABLE request_custom_types RENAME CONSTRAINT tender_request_custom_types_pkey TO request_custom_types_pkey;
ALTER TABLE request_custom_types
    RENAME CONSTRAINT tender_request_custom_types_custom_type_check TO request_custom_types_custom_type_check;
ALTER TABLE request_custom_types RENAME COLUMN tender_request_id TO request_id;

-- L-12: logos are object keys, ordered
ALTER TABLE tender_request_logos RENAME TO request_logos;
ALTER TABLE request_logos RENAME COLUMN tender_request_id TO request_id;
ALTER TABLE request_logos RENAME COLUMN file_url TO object_key;
ALTER TABLE request_logos ADD COLUMN position integer;
UPDATE request_logos l
SET position = n.rn
FROM (SELECT ctid, row_number() OVER (PARTITION BY request_id ORDER BY object_key) AS rn FROM request_logos) n
WHERE l.ctid = n.ctid;
ALTER TABLE request_logos ALTER COLUMN position SET NOT NULL;
ALTER TABLE request_logos ADD CONSTRAINT request_logos_pkey PRIMARY KEY (request_id, position);

-- ---------------------------------------------------------------------------------------------------------------
-- quote_requests: delivery address copied into the request (L-15: province code)
-- ---------------------------------------------------------------------------------------------------------------
ALTER TABLE quote_requests RENAME COLUMN delivery_area_code TO delivery_province_code;
ALTER TABLE quote_requests ALTER COLUMN delivery_province_code TYPE varchar(2);
ALTER TABLE quote_requests ADD COLUMN delivery_recipient_name varchar(100);
ALTER TABLE quote_requests ADD COLUMN delivery_recipient_phone varchar(10);
ALTER TABLE quote_requests ADD CONSTRAINT ck_quote_requests_quantity CHECK (quantity > 0);
ALTER TABLE quote_requests ADD CONSTRAINT ck_quote_requests_budget CHECK (budget IS NULL OR budget > 0);
-- a direct request names its vendor (FR-15)
ALTER TABLE quote_requests ADD CONSTRAINT ck_quote_requests_direct_target
    CHECK (type <> 'DIRECT' OR target_vendor_id IS NOT NULL);

-- ---------------------------------------------------------------------------------------------------------------
-- L-10: quotes. Every amount is computed by the server and frozen on submit; a price change is a new revision.
-- ---------------------------------------------------------------------------------------------------------------
ALTER TABLE quotes RENAME COLUMN tender_request_id TO request_id;

ALTER TABLE quotes ADD COLUMN revision_no integer NOT NULL DEFAULT 1;
ALTER TABLE quotes ADD COLUMN supersedes_quote_id varchar(255);
ALTER TABLE quotes ADD COLUMN items_amount bigint;
ALTER TABLE quotes ADD COLUMN shipping_fee bigint;
ALTER TABLE quotes ADD COLUMN deposit_amount bigint;
ALTER TABLE quotes ADD COLUMN remaining_amount bigint;
ALTER TABLE quotes ADD COLUMN submitted_at timestamptz;

-- quote lines (AC-38.1, AC-38.2): PRODUCT lines sum to items_amount, CUSTOM lines to custom_surcharge
CREATE TABLE quote_items (
    quote_id    varchar(255) NOT NULL,
    line_no     integer      NOT NULL,
    kind        varchar(10)  NOT NULL,
    description varchar(255) NOT NULL,
    product_ref varchar(36),
    custom_type varchar(20),
    quantity    integer      NOT NULL,
    unit_price  bigint       NOT NULL,
    amount      bigint       NOT NULL,
    CONSTRAINT quote_items_pkey PRIMARY KEY (quote_id, line_no),
    CONSTRAINT fk_quote_items_quote FOREIGN KEY (quote_id) REFERENCES quotes (id),
    CONSTRAINT ck_quote_items_kind CHECK (kind IN ('PRODUCT', 'CUSTOM')),
    CONSTRAINT ck_quote_items_custom_type CHECK (
        (kind = 'PRODUCT' AND custom_type IS NULL)
        OR (kind = 'CUSTOM' AND custom_type IN ('BAG', 'CARD', 'STICKER', 'TEMPLATE_BOX'))),
    CONSTRAINT ck_quote_items_values CHECK (quantity > 0 AND unit_price >= 0 AND amount = quantity * unit_price)
);

-- existing quotes (dev only) had a single unit price and quantity: they become one PRODUCT line
INSERT INTO quote_items (quote_id, line_no, kind, description, quantity, unit_price, amount)
SELECT id, 1, 'PRODUCT', 'Bánh theo yêu cầu', quantity, unit_price, quantity * unit_price
FROM quotes;

UPDATE quotes
SET custom_surcharge = coalesce(custom_surcharge, 0),
    items_amount     = quantity * unit_price,
    shipping_fee     = greatest(total_amount - quantity * unit_price - coalesce(custom_surcharge, 0), 0),
    submitted_at     = coalesce(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', now());
UPDATE quotes SET total_amount = items_amount + custom_surcharge + shipping_fee;
UPDATE quotes
SET deposit_amount   = floor(total_amount * deposit_rate / 100)::bigint,
    remaining_amount = total_amount - floor(total_amount * deposit_rate / 100)::bigint;

ALTER TABLE quotes DROP COLUMN unit_price;
ALTER TABLE quotes DROP COLUMN quantity;
ALTER TABLE quotes ALTER COLUMN custom_surcharge SET DEFAULT 0;
ALTER TABLE quotes ALTER COLUMN custom_surcharge SET NOT NULL;
ALTER TABLE quotes ALTER COLUMN items_amount SET NOT NULL;
ALTER TABLE quotes ALTER COLUMN shipping_fee SET NOT NULL;
ALTER TABLE quotes ALTER COLUMN deposit_amount SET NOT NULL;
ALTER TABLE quotes ALTER COLUMN remaining_amount SET NOT NULL;
ALTER TABLE quotes ALTER COLUMN submitted_at SET NOT NULL;

ALTER TABLE quotes ADD CONSTRAINT fk_quotes_supersedes FOREIGN KEY (supersedes_quote_id) REFERENCES quotes (id);
ALTER TABLE quotes ADD CONSTRAINT ck_quotes_amounts CHECK (
    items_amount >= 0 AND custom_surcharge >= 0 AND shipping_fee >= 0
    AND total_amount = items_amount + custom_surcharge + shipping_fee);
-- deposit rounds down to the đồng; the rest is paid on delivery (FR-19, FR-22)
ALTER TABLE quotes ADD CONSTRAINT ck_quotes_deposit CHECK (
    deposit_rate > 0 AND deposit_rate <= 100
    AND deposit_amount = floor(total_amount * deposit_rate / 100)
    AND remaining_amount = total_amount - deposit_amount);
ALTER TABLE quotes ADD CONSTRAINT ck_quotes_revision CHECK (
    revision_no >= 1 AND (revision_no = 1) = (supersedes_quote_id IS NULL));
-- a vendor has at most one live quote per request (BR-05: change = withdraw + new revision)
CREATE UNIQUE INDEX ux_quotes_one_submitted_per_vendor ON quotes (request_id, vendor_id) WHERE status = 'SUBMITTED';
-- valid_until 1–14 days after submission (Q-19 interim value) is checked by the service

-- ---------------------------------------------------------------------------------------------------------------
-- L-10: acceptance = binding copy of the accepted quote. The deposit is charged from this copy; the order is
-- created from it (D-12). snapshot and content_hash never change once written.
-- ---------------------------------------------------------------------------------------------------------------
CREATE TABLE quote_acceptances (
    id                   varchar(36)  NOT NULL,
    quote_id             varchar(255) NOT NULL,
    request_id           varchar(255) NOT NULL,
    buyer_account_id     varchar(36)  NOT NULL,
    vendor_id            varchar(36)  NOT NULL,
    buyer_legal_name     varchar(100) NOT NULL,
    buyer_id_masked      varchar(12)  NOT NULL,
    vendor_business_name varchar(255) NOT NULL,
    vendor_tax_code      varchar(20)  NOT NULL,
    invoice_name         varchar(255),
    invoice_tax_code     varchar(20),
    invoice_address      varchar(255),
    invoice_email        varchar(255),
    snapshot             jsonb        NOT NULL,
    content_hash         char(64)     NOT NULL,
    deposit_amount       bigint       NOT NULL,
    payment_ref          varchar(64),
    status               varchar(20)  NOT NULL,
    accepted_at          timestamptz  NOT NULL DEFAULT now(),
    payment_expires_at   timestamptz  NOT NULL,
    paid_at              timestamptz,
    updated_at           timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT quote_acceptances_pkey PRIMARY KEY (id),
    CONSTRAINT fk_quote_acceptances_quote FOREIGN KEY (quote_id) REFERENCES quotes (id),
    CONSTRAINT fk_quote_acceptances_request FOREIGN KEY (request_id) REFERENCES quote_requests (id),
    CONSTRAINT ck_quote_acceptances_status CHECK (status IN ('PENDING_PAYMENT', 'SUCCEEDED', 'FAILED', 'EXPIRED')),
    CONSTRAINT ck_quote_acceptances_deposit CHECK (deposit_amount > 0),
    CONSTRAINT ck_quote_acceptances_paid CHECK ((status = 'SUCCEEDED') = (paid_at IS NOT NULL)),
    -- FR-24: business invoice details are all present or all absent
    CONSTRAINT ck_quote_acceptances_invoice CHECK (
        (invoice_name IS NULL) = (invoice_tax_code IS NULL)
        AND (invoice_name IS NULL) = (invoice_address IS NULL)
        AND (invoice_name IS NULL) = (invoice_email IS NULL))
);
-- BR-17: one accepted quote per request; at most one deposit in flight per quote
CREATE UNIQUE INDEX ux_quote_acceptances_one_succeeded ON quote_acceptances (request_id) WHERE status = 'SUCCEEDED';
CREATE UNIQUE INDEX ux_quote_acceptances_one_pending ON quote_acceptances (quote_id) WHERE status = 'PENDING_PAYMENT';
CREATE INDEX ix_quote_acceptances_pending_expiry ON quote_acceptances (payment_expires_at) WHERE status = 'PENDING_PAYMENT';

CREATE FUNCTION forbid_acceptance_snapshot_change() RETURNS trigger
    LANGUAGE plpgsql AS
$$
BEGIN
    IF NEW.snapshot IS DISTINCT FROM OLD.snapshot
        OR NEW.content_hash IS DISTINCT FROM OLD.content_hash
        OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
        OR NEW.quote_id IS DISTINCT FROM OLD.quote_id THEN
        RAISE EXCEPTION 'quote_acceptances % is a binding copy: snapshot, hash, deposit and quote cannot change', OLD.id;
    END IF;
    RETURN NEW;
END
$$;
CREATE TRIGGER tg_quote_acceptances_immutable
    BEFORE UPDATE ON quote_acceptances
    FOR EACH ROW EXECUTE FUNCTION forbid_acceptance_snapshot_change();

-- ---------------------------------------------------------------------------------------------------------------
-- copies and messaging
-- ---------------------------------------------------------------------------------------------------------------
-- vendor copy from vendor.updated: matching of open requests (BR-16), supplier list (FR-14), BR-22, BR-31
CREATE TABLE vendor_snapshots (
    vendor_id           varchar(36)  NOT NULL,
    owner_account_id    varchar(36)  NOT NULL,
    business_name       varchar(255) NOT NULL,
    status              varchar(20)  NOT NULL,
    can_operate         boolean      NOT NULL,
    sells_shop          boolean      NOT NULL,
    accepts_orders      boolean      NOT NULL,
    supply_source       varchar(20)  NOT NULL,
    delivery_areas      text[]       NOT NULL DEFAULT '{}',
    min_qty             integer,
    ref_price_tiers     jsonb        NOT NULL DEFAULT '[]',
    lead_time_days      integer,
    custom_capabilities text[]       NOT NULL DEFAULT '{}',
    early_bird_offer    text,
    production_profile  jsonb        NOT NULL DEFAULT '{}',
    source_version      bigint       NOT NULL,
    updated_at          timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT vendor_snapshots_pkey PRIMARY KEY (vendor_id)
);
CREATE INDEX ix_vendor_snapshots_orders ON vendor_snapshots (min_qty) WHERE accepts_orders AND can_operate;

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
