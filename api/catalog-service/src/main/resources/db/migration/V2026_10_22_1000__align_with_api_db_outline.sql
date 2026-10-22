-- catalog_db: align with the API/DB outline of 2026-10-22.
-- L-18: catalog-service is the read side of products. vendor-service is the only writer; catalog keeps product_views
-- built from product.upserted / vendor.updated / review.created. catalog still owns the interprovince fee table and
-- computes delivery fees (D-14).
-- Database review of 2026-10-22 (P-05, P-07, P-08): docs/architecture/api-db/db-review-proposals.md

-- ---------------------------------------------------------------------------------------------------------------
-- the write model moves to vendor_db (dev data is re-created from vendor-service's seed)
-- ---------------------------------------------------------------------------------------------------------------
DROP TABLE product_images;
DROP TABLE product_price_tiers;
DROP TABLE products;

-- ---------------------------------------------------------------------------------------------------------------
-- read model
-- ---------------------------------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- one row per product for search, filters and the detail page (FR-05 → FR-07). Product fields only: the vendor's
-- fields live once, in vendor_snapshots, and are joined by the product_listings view below, so locking a Shop changes
-- one row and two event streams never write the same column.
-- Applied only when source_version is newer than the stored one, so late or repeated events are ignored.
CREATE TABLE product_views (
    product_id       varchar(36)  NOT NULL,
    vendor_id        varchar(36)  NOT NULL,
    name             varchar(255) NOT NULL,
    description      text         NOT NULL,
    cake_type        varchar(100),
    brand            varchar(255),
    origin           varchar(255),
    pieces_per_box   integer,
    list_price       bigint       NOT NULL,
    stock            integer      NOT NULL,
    expiry_date      date         NOT NULL,
    delivery_label   varchar(20)  NOT NULL,
    quote_threshold  integer,
    status           varchar(20)  NOT NULL,
    image_keys       text[]       NOT NULL DEFAULT '{}',
    price_tiers      jsonb        NOT NULL DEFAULT '[]',
    rating_avg       numeric(3, 2),
    rating_count     integer      NOT NULL DEFAULT 0,
    source_version   bigint       NOT NULL,
    updated_at       timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT product_views_pkey PRIMARY KEY (product_id),
    CONSTRAINT ck_product_views_delivery_label CHECK (delivery_label IN ('LOCAL', 'NATIONWIDE')),
    CONSTRAINT ck_product_views_status CHECK (status IN ('ON_SALE', 'HIDDEN', 'REMOVED'))
);
-- public listing: on sale, delivery label, then the vendor (BR-13, BR-21, BR-31)
CREATE INDEX ix_product_views_listing ON product_views (status, delivery_label, vendor_id);
CREATE INDEX ix_product_views_vendor ON product_views (vendor_id, status);
-- keyword search on name and brand (AC-06.1)
CREATE INDEX ix_product_views_name_trgm ON product_views USING gin (name gin_trgm_ops);
CREATE INDEX ix_product_views_brand_trgm ON product_views USING gin (brand gin_trgm_ops);

-- copy of reviews from order-service, served at GET /api/products/{productId}/reviews (AC-11.3)
CREATE TABLE product_reviews (
    review_id  varchar(36) NOT NULL,
    product_id varchar(36) NOT NULL,
    vendor_id  varchar(36) NOT NULL,
    rating     smallint    NOT NULL,
    content    text,
    created_at timestamptz NOT NULL,
    CONSTRAINT product_reviews_pkey PRIMARY KEY (review_id),
    CONSTRAINT ck_product_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);
CREATE INDEX ix_product_reviews_product ON product_reviews (product_id, created_at);

-- copy of the vendor from vendor.updated: Shop filter, delivery fee inside the vendor's areas (BR-20, BR-30, BR-31)
CREATE TABLE vendor_snapshots (
    vendor_id          varchar(36)  NOT NULL,
    owner_account_id   varchar(36)  NOT NULL,
    business_name      varchar(255) NOT NULL,
    status             varchar(20)  NOT NULL,
    can_operate        boolean      NOT NULL,
    sells_shop         boolean      NOT NULL,
    delivery_areas     text[]       NOT NULL DEFAULT '{}',
    local_delivery_fee bigint,
    source_version     bigint       NOT NULL,
    updated_at         timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT vendor_snapshots_pkey PRIMARY KEY (vendor_id)
);
-- vendors whose products may be listed (BR-21, BR-31)
CREATE INDEX ix_vendor_snapshots_listing ON vendor_snapshots (vendor_id) WHERE can_operate AND sells_shop;
-- "giao nội thành" products are matched against the buyer's province
CREATE INDEX ix_vendor_snapshots_delivery_areas ON vendor_snapshots USING gin (delivery_areas);

-- what the public API reads: a product with its vendor's current state (read-only, @Immutable entity)
CREATE VIEW product_listings AS
SELECT p.*,
       v.business_name AS vendor_name,
       v.owner_account_id,
       v.delivery_areas,
       v.local_delivery_fee,
       v.can_operate,
       v.sells_shop
FROM product_views p
JOIN vendor_snapshots v ON v.vendor_id = p.vendor_id;

-- ---------------------------------------------------------------------------------------------------------------
-- provinces (A-18): the 34 provincial units of Quyết định 19/2025/QĐ-TTg, effective 01/07/2025. The rows come from
-- R__provinces.sql in this folder, which must match com.moonkage.reference.Province in api/common-reference. Other
-- services check province codes against that enum and keep no table.
-- ---------------------------------------------------------------------------------------------------------------
CREATE TABLE provinces (
    code varchar(2)   NOT NULL,
    name varchar(100) NOT NULL,
    CONSTRAINT provinces_pkey PRIMARY KEY (code),
    CONSTRAINT ck_provinces_code CHECK (code ~ '^[0-9]{2}$')
);

-- ---------------------------------------------------------------------------------------------------------------
-- interprovince fees (FR-52, BR-30). One current fee per receiving province; the admin saves the whole table and it
-- must cover every row of provinces (checked by the service).
-- ---------------------------------------------------------------------------------------------------------------
CREATE TABLE interprovince_fees (
    province_code  varchar(2)  NOT NULL,
    fee            bigint      NOT NULL,
    effective_from timestamptz NOT NULL DEFAULT now(),
    updated_by     varchar(36),
    CONSTRAINT interprovince_fees_pkey PRIMARY KEY (province_code),
    CONSTRAINT fk_interprovince_fees_province FOREIGN KEY (province_code) REFERENCES provinces (code),
    CONSTRAINT ck_interprovince_fees_fee CHECK (fee >= 0)
);

-- ---------------------------------------------------------------------------------------------------------------
-- messaging
-- ---------------------------------------------------------------------------------------------------------------
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
