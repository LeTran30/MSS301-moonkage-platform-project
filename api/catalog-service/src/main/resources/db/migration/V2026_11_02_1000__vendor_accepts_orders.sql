-- catalog_db: whether a Shop takes custom orders, from vendor.updated / vendor.locked (contract v1 §6). The product
-- detail shows the "send a request to this Shop" way in only when it does (M2.1, FR-14).

-- product_listings names the vendor columns it joins, so it is rebuilt around the new one
DROP VIEW product_listings;

ALTER TABLE vendor_snapshots
    ADD COLUMN accepts_orders boolean NOT NULL DEFAULT false;

CREATE VIEW product_listings AS
SELECT p.*,
       v.business_name AS vendor_name,
       v.owner_account_id,
       v.delivery_areas,
       v.local_delivery_fee,
       v.can_operate,
       v.sells_shop,
       v.accepts_orders AS vendor_accepts_orders
FROM product_views p
JOIN vendor_snapshots v ON v.vendor_id = p.vendor_id;
