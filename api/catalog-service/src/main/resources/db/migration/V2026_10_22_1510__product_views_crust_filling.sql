-- catalog_db: filter products by crust and filling (Requirement v1.7, AC-06.2, BR-34; decision L-19).
-- vendor-service owns the catalogue of crusts and fillings (cake_attributes) and sends a product's codes in
-- product.upserted. catalog keeps the codes only: codes never change, so renaming a value in the admin needs no update
-- here, and the web takes labels and order from GET /api/cake-attributes.
-- Filters: several values in one filter match any of them (&&); different filters must all match (AC-06.2).

-- product_listings selects p.*, so it is rebuilt around the column change
DROP VIEW product_listings;

ALTER TABLE product_views
    DROP COLUMN cake_type,
    ADD COLUMN crust_codes   text[] NOT NULL DEFAULT '{}',
    ADD COLUMN filling_codes text[] NOT NULL DEFAULT '{}';

CREATE INDEX ix_product_views_crust_codes ON product_views USING gin (crust_codes);
CREATE INDEX ix_product_views_filling_codes ON product_views USING gin (filling_codes);

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
