-- vendor_db: align with the API/DB outline of 2026-10-22.
-- Decisions: L-01 + BR-33 (no company sellers for now), L-02 (business_name), L-03 (verification, fees, documents,
-- in one migration), L-07 (timestamptz), L-12 (object keys), L-15 (province codes), L-18 (vendor-service is the only
-- writer of products; catalog keeps a read model).
-- Database review of 2026-10-22 (P-01, P-08, P-09): docs/architecture/api-db/db-review-proposals.md

-- ---------------------------------------------------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------------------------------------------------

-- L-02 (D-09): the unit's name is business_name; legal_name belongs to a person (identity)
ALTER TABLE vendors RENAME COLUMN legal_name TO business_name;

-- L-15: head-office area is a province code
ALTER TABLE vendors RENAME COLUMN area_code TO province_code;
ALTER TABLE vendors ALTER COLUMN province_code TYPE varchar(2);

-- NFR-03: the bank account number is encrypted like the citizen id (AES-GCM, key version in pii_key_ver) and only
-- shown masked. SQL cannot encrypt, so rows from before this migration keep the masked form only and the owner enters
-- the number again before the first payout.
ALTER TABLE vendors ADD COLUMN bank_account_number_enc bytea;
ALTER TABLE vendors ADD COLUMN bank_account_masked varchar(20);
ALTER TABLE vendors ADD COLUMN pii_key_ver integer;
UPDATE vendors
SET bank_account_masked = repeat('*', greatest(length(account_number) - 4, 0)) || right(account_number, 4)
WHERE account_number IS NOT NULL AND btrim(account_number) <> '';
ALTER TABLE vendors DROP COLUMN account_number;
ALTER TABLE vendors RENAME COLUMN account_holder TO bank_account_holder;
ALTER TABLE vendors ADD CONSTRAINT ck_vendors_bank_account_enc
    CHECK ((bank_account_number_enc IS NULL) = (pii_key_ver IS NULL)
       AND (bank_account_number_enc IS NULL OR bank_account_masked IS NOT NULL));

-- L-01, BR-33: only household businesses and sole proprietorships register through the system.
-- Rows typed ENTERPRISE before this rule (dev seed only) become SOLE_PROPRIETORSHIP.
ALTER TABLE vendors DROP CONSTRAINT vendors_entity_type_check;
UPDATE vendors SET entity_type = 'SOLE_PROPRIETORSHIP' WHERE entity_type = 'ENTERPRISE';
ALTER TABLE vendors ALTER COLUMN entity_type TYPE varchar(30);
ALTER TABLE vendors ADD CONSTRAINT vendors_entity_type_check
    CHECK (entity_type IN ('HOUSEHOLD_BUSINESS', 'SOLE_PROPRIETORSHIP'));

-- L-03: owner / representative as written on the business licence (BR-27, AC-26.1, AC-26.8).
-- Only the keyed hash (made by identity-service, NFR-03) and the masked form are kept; never the full number.
-- Nullable at the database level because rows submitted before this migration have no value; the service requires
-- them on every submission.
ALTER TABLE vendors ADD COLUMN representative_name varchar(100);
ALTER TABLE vendors ADD COLUMN representative_id_hash varchar(64);
ALTER TABLE vendors ADD COLUMN representative_id_key_ver integer;
ALTER TABLE vendors ADD COLUMN representative_id_masked varchar(12);
ALTER TABLE vendors ADD CONSTRAINT ck_vendors_representative_id_complete
    CHECK ((representative_id_hash IS NULL) = (representative_id_key_ver IS NULL)
       AND (representative_id_hash IS NULL) = (representative_id_masked IS NULL));

-- L-03: flat local delivery fee per order inside the vendor's areas (FR-28, BR-30)
ALTER TABLE vendors ADD COLUMN local_delivery_fee bigint;
ALTER TABLE vendors ADD CONSTRAINT ck_vendors_local_delivery_fee CHECK (local_delivery_fee IS NULL OR local_delivery_fee >= 0);

-- L-03: registration fee paid once after approval (BR-31); amount is the level at payment time (AC-53.2)
ALTER TABLE vendors ADD COLUMN registration_fee_payment_id varchar(36);
ALTER TABLE vendors ADD COLUMN registration_fee_amount bigint;
ALTER TABLE vendors ADD COLUMN registration_fee_paid_at timestamptz;
ALTER TABLE vendors ADD CONSTRAINT ck_vendors_registration_fee
    CHECK ((registration_fee_paid_at IS NULL) = (registration_fee_amount IS NULL)
       AND (registration_fee_amount IS NULL OR registration_fee_amount > 0));

ALTER TABLE vendors ADD COLUMN version bigint NOT NULL DEFAULT 0;

ALTER TABLE vendors ADD CONSTRAINT ck_vendors_sells_something CHECK (sells_shop OR accepts_orders);

-- ---------------------------------------------------------------------------------------------------------------
-- delivery areas, order profile
-- ---------------------------------------------------------------------------------------------------------------

-- L-15: a delivery area is a province code (Q-12)
ALTER TABLE vendor_delivery_areas RENAME COLUMN area_code TO province_code;
ALTER TABLE vendor_delivery_areas ALTER COLUMN province_code TYPE varchar(2);
ALTER TABLE vendor_delivery_areas RENAME CONSTRAINT uk535e3xpocjv51ri9829ga9ihw TO uk_vendor_delivery_areas_province;

ALTER TABLE ref_price_tiers ADD CONSTRAINT uk_ref_price_tiers_from_qty UNIQUE (order_profile_id, from_qty);
ALTER TABLE ref_price_tiers ADD CONSTRAINT ck_ref_price_tiers_values CHECK (from_qty > 0 AND unit_price >= 0);
ALTER TABLE order_profiles ADD CONSTRAINT ck_order_profiles_min_qty CHECK (min_qty > 0 AND lead_time_days >= 0);

-- ---------------------------------------------------------------------------------------------------------------
-- L-03: documents, owner checks, review history, registration fee level
-- ---------------------------------------------------------------------------------------------------------------

-- private bucket vendor-docs; AGREEMENT is not a kind because companies do not register (BR-33)
CREATE TABLE vendor_documents (
    id          varchar(36)  NOT NULL,
    vendor_id   varchar(255) NOT NULL,
    kind        varchar(30)  NOT NULL,
    object_key  varchar(255) NOT NULL,
    uploaded_at timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT vendor_documents_pkey PRIMARY KEY (id),
    CONSTRAINT fk_vendor_documents_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id),
    CONSTRAINT ck_vendor_documents_kind CHECK (kind IN ('BUSINESS_LICENSE', 'FOOD_SAFETY', 'FEE_INVOICE'))
);
CREATE INDEX ix_vendor_documents_vendor ON vendor_documents (vendor_id);

-- one immutable row per submission (AC-26.8): did the declared id number match the owner's NFC CCCD, did the name
-- match (A-15: two levels)
CREATE TABLE vendor_owner_checks (
    id               varchar(36)  NOT NULL,
    vendor_id        varchar(255) NOT NULL,
    submission_no    integer      NOT NULL,
    owner_legal_name varchar(100) NOT NULL,
    owner_id_masked  varchar(12)  NOT NULL,
    nfc_verified_at  timestamptz  NOT NULL,
    id_match         boolean      NOT NULL,
    name_match       varchar(10)  NOT NULL,
    checked_at       timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT vendor_owner_checks_pkey PRIMARY KEY (id),
    CONSTRAINT fk_vendor_owner_checks_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id),
    CONSTRAINT uk_vendor_owner_checks_submission UNIQUE (vendor_id, submission_no),
    CONSTRAINT ck_vendor_owner_checks_name_match CHECK (name_match IN ('MATCH', 'MISMATCH'))
);

-- each admin decision with the confirmations of AC-45.5; a reason is required unless approved (AC-45.2)
CREATE TABLE vendor_reviews (
    id               varchar(36)  NOT NULL,
    vendor_id        varchar(255) NOT NULL,
    admin_account_id varchar(36)  NOT NULL,
    decision         varchar(20)  NOT NULL,
    reason           text,
    license_checked  boolean      NOT NULL,
    registry_checked boolean      NOT NULL,
    decided_at       timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT vendor_reviews_pkey PRIMARY KEY (id),
    CONSTRAINT fk_vendor_reviews_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id),
    CONSTRAINT ck_vendor_reviews_decision CHECK (decision IN ('APPROVE', 'NEEDS_INFO', 'REJECT')),
    CONSTRAINT ck_vendor_reviews_reason CHECK (decision = 'APPROVE' OR (reason IS NOT NULL AND btrim(reason) <> ''))
);
CREATE INDEX ix_vendor_reviews_vendor ON vendor_reviews (vendor_id, decided_at);

-- FR-53: the current level is the row with the latest effective_from
CREATE TABLE registration_fee_configs (
    id             varchar(36) NOT NULL,
    amount         bigint      NOT NULL,
    effective_from timestamptz NOT NULL,
    created_by     varchar(36),
    CONSTRAINT registration_fee_configs_pkey PRIMARY KEY (id),
    CONSTRAINT ck_registration_fee_configs_amount CHECK (amount > 0)
);
-- default level 200.000đ (BR-31); required in every environment, so it lives here and not in the dev seed
INSERT INTO registration_fee_configs (id, amount, effective_from, created_by)
VALUES ('00000000-0000-4000-8000-000800000001', 200000, now(), NULL);

-- same shape as identity-service's outbox (NFR-05)
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
-- L-18: products are written here only (moved from catalog-service, which keeps a read model)
-- Catalog's rows cannot be copied across databases by Flyway; dev data is re-created from the seed.
-- ---------------------------------------------------------------------------------------------------------------

CREATE TABLE products (
    id             varchar(36)  NOT NULL,
    vendor_id      varchar(255) NOT NULL,
    name           varchar(255) NOT NULL,
    description    text         NOT NULL,
    cake_type      varchar(100),
    brand          varchar(255),
    origin         varchar(255),
    pieces_per_box integer,
    list_price     bigint       NOT NULL,
    stock          integer      NOT NULL,
    expiry_date    date         NOT NULL,
    delivery_label varchar(20)  NOT NULL,
    quote_threshold integer,
    status         varchar(20)  NOT NULL,
    removed_reason text,
    removed_by     varchar(36),
    version        bigint       NOT NULL DEFAULT 0,
    created_at     timestamptz  NOT NULL DEFAULT now(),
    updated_at     timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT fk_products_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id),
    CONSTRAINT ck_products_stock CHECK (stock >= 0),
    CONSTRAINT ck_products_list_price CHECK (list_price > 0),
    CONSTRAINT ck_products_pieces CHECK (pieces_per_box IS NULL OR pieces_per_box > 0),
    CONSTRAINT ck_products_quote_threshold CHECK (quote_threshold IS NULL OR quote_threshold > 0),
    CONSTRAINT ck_products_delivery_label CHECK (delivery_label IN ('LOCAL', 'NATIONWIDE')),
    CONSTRAINT ck_products_status CHECK (status IN ('ON_SALE', 'HIDDEN', 'REMOVED')),
    -- BR-24: a removed product carries its reason
    CONSTRAINT ck_products_removed CHECK (status <> 'REMOVED' OR removed_reason IS NOT NULL)
);
CREATE INDEX ix_products_vendor ON products (vendor_id, status);
-- brand and origin are required for resold products (BR-12): checked by the service, since it depends on
-- vendors.supply_source

CREATE TABLE product_images (
    product_id varchar(36)  NOT NULL,
    position   integer      NOT NULL,
    object_key varchar(255) NOT NULL,
    CONSTRAINT product_images_pkey PRIMARY KEY (product_id, position),
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE TABLE product_price_tiers (
    id         varchar(36) NOT NULL,
    product_id varchar(36) NOT NULL,
    from_qty   integer     NOT NULL,
    unit_price bigint      NOT NULL,
    CONSTRAINT product_price_tiers_pkey PRIMARY KEY (id),
    CONSTRAINT fk_product_price_tiers_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT uk_product_price_tiers_from_qty UNIQUE (product_id, from_qty),
    CONSTRAINT ck_product_price_tiers_values CHECK (from_qty > 0 AND unit_price > 0)
);

-- BR-28, D-01: stock held for a checkout while the buyer pays; one row per product per checkout.
-- The hold exists before any payment, and order-service sets expires_at from the checkout, so there is one clock.
-- A late successful payment may hold a RELEASED row again.
CREATE TABLE stock_reservations (
    id          varchar(36) NOT NULL,
    product_id  varchar(36) NOT NULL,
    qty         integer     NOT NULL,
    checkout_id varchar(36) NOT NULL,
    status      varchar(20) NOT NULL,
    expires_at  timestamptz NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT stock_reservations_pkey PRIMARY KEY (id),
    CONSTRAINT fk_stock_reservations_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT uk_stock_reservations_checkout_product UNIQUE (checkout_id, product_id),
    CONSTRAINT ck_stock_reservations_qty CHECK (qty > 0),
    CONSTRAINT ck_stock_reservations_status CHECK (status IN ('HELD', 'COMMITTED', 'RELEASED'))
);
-- the sweep that releases expired holds reads HELD rows by expiry
CREATE INDEX ix_stock_reservations_held ON stock_reservations (expires_at) WHERE status = 'HELD';

-- ---------------------------------------------------------------------------------------------------------------
-- L-07: every point in time is timestamptz. Containers run TZ=Asia/Ho_Chi_Minh, so the old naive values are
-- Vietnam local time.
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
