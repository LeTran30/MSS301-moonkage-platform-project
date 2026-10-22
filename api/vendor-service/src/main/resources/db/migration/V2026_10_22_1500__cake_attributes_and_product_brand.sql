-- vendor_db: crust and filling of a Shop product, and its brand (Requirement v1.7, BR-12, BR-34, FR-54; decision L-19).
--
-- Cakes are classified on two independent axes, crust (vỏ) and filling (nhân). The values are data, not code: the
-- admin adds, renames, reorders and hides them (FR-54), so they live in cake_attributes, not in an enum. A product
-- links to at least one crust and at least one filling, several allowed (a gift box holds mixed cakes); vendor-service
-- checks the "at least one of each" rule and the "last visible value of a group" rule (AC-54.5).
-- Every product has a brand: a pure reseller types it (AC-29.2); anyone else may leave it empty and vendor-service
-- writes the vendor's business_name (AC-29.4). products has no rows yet (written by vendor only since L-18), so the
-- column is made NOT NULL without a backfill.

-- ---------------------------------------------------------------------------------------------------------------
-- the catalogue of crusts and fillings (FR-54)
-- ---------------------------------------------------------------------------------------------------------------
CREATE TABLE cake_attributes (
    id              varchar(36)  NOT NULL,
    attribute_group varchar(10)  NOT NULL,
    -- built from the label when created (lower case, no accents, hyphens); never changes, so events and filters use it
    code            varchar(60)  NOT NULL,
    label           varchar(100) NOT NULL,
    -- the label folded for the duplicate check (no accents, lower case, single spaces), written by vendor-service
    label_key       varchar(100) NOT NULL,
    sort_order      integer      NOT NULL,
    -- false = hidden (AC-54.4); values are never deleted, products keep what they link to
    active          boolean      NOT NULL DEFAULT true,
    version         bigint       NOT NULL DEFAULT 0,
    created_at      timestamptz  NOT NULL DEFAULT now(),
    updated_at      timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT cake_attributes_pkey PRIMARY KEY (id),
    CONSTRAINT ck_cake_attributes_group CHECK (attribute_group IN ('CRUST', 'FILLING')),
    CONSTRAINT ck_cake_attributes_code CHECK (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT ck_cake_attributes_label CHECK (btrim(label) <> ''),
    CONSTRAINT uq_cake_attributes_code UNIQUE (attribute_group, code),
    CONSTRAINT uq_cake_attributes_label UNIQUE (attribute_group, label_key)
);
-- the seller's picker and the buyer's filter: visible values of one group, in the admin's order (AC-06.6, AC-54.6)
CREATE INDEX ix_cake_attributes_group ON cake_attributes (attribute_group, active, sort_order);

-- which crusts and fillings a product has
CREATE TABLE product_cake_attributes (
    product_id   varchar(36) NOT NULL,
    attribute_id varchar(36) NOT NULL,
    CONSTRAINT product_cake_attributes_pkey PRIMARY KEY (product_id, attribute_id),
    CONSTRAINT fk_product_cake_attributes_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_cake_attributes_attribute FOREIGN KEY (attribute_id) REFERENCES cake_attributes (id)
);
CREATE INDEX ix_product_cake_attributes_attribute ON product_cake_attributes (attribute_id);

-- the starting catalogue (A-19). It runs once, in every environment; after that only the admin changes it.
INSERT INTO cake_attributes (id, attribute_group, code, label, label_key, sort_order) VALUES
    ('a1f0c0de-0000-4000-8000-000000000101', 'CRUST',   'banh-nuong', 'Bánh nướng', 'banh nuong', 1),
    ('a1f0c0de-0000-4000-8000-000000000102', 'CRUST',   'banh-deo',   'Bánh dẻo',   'banh deo',   2),
    ('a1f0c0de-0000-4000-8000-000000000103', 'CRUST',   'banh-lanh',  'Bánh lạnh',  'banh lanh',  3),
    ('a1f0c0de-0000-4000-8000-000000000199', 'CRUST',   'khac',       'Khác',       'khac',       99),
    ('a1f0c0de-0000-4000-8000-000000000201', 'FILLING', 'thap-cam',   'Thập cẩm',   'thap cam',   1),
    ('a1f0c0de-0000-4000-8000-000000000202', 'FILLING', 'dau-xanh',   'Đậu xanh',   'dau xanh',   2),
    ('a1f0c0de-0000-4000-8000-000000000203', 'FILLING', 'hat-sen',    'Hạt sen',    'hat sen',    3),
    ('a1f0c0de-0000-4000-8000-000000000204', 'FILLING', 'dau-do',     'Đậu đỏ',     'dau do',     4),
    ('a1f0c0de-0000-4000-8000-000000000205', 'FILLING', 'khoai-mon',  'Khoai môn',  'khoai mon',  5),
    ('a1f0c0de-0000-4000-8000-000000000206', 'FILLING', 'tra-xanh',   'Trà xanh',   'tra xanh',   6),
    ('a1f0c0de-0000-4000-8000-000000000207', 'FILLING', 'sau-rieng',  'Sầu riêng',  'sau rieng',  7),
    ('a1f0c0de-0000-4000-8000-000000000208', 'FILLING', 'trung-muoi', 'Trứng muối', 'trung muoi', 8),
    ('a1f0c0de-0000-4000-8000-000000000299', 'FILLING', 'khac',       'Khác',       'khac',       99);

-- ---------------------------------------------------------------------------------------------------------------
-- products: the single cake_type column gives way to the links above; brand becomes required
-- ---------------------------------------------------------------------------------------------------------------
ALTER TABLE products
    DROP COLUMN cake_type,
    ALTER COLUMN brand SET NOT NULL,
    ADD CONSTRAINT ck_products_brand CHECK (btrim(brand) <> '');
