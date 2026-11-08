-- catalog_db: the province of the shop (B-3.1). The public listing joins the vendor copy, so the buyer sees
-- which province the shop is in (L-15). The province travels in the vendor.updated / vendor.locked snapshot
-- (contract §6), like accepts_orders did in V2026_11_02_1000.
--
-- Nullable on purpose: a vendor copy written before this field existed has no province, and a shop whose profile
-- was never completed has none either. The listing then shows no province instead of a made-up one.

-- product_listings names the vendor columns it joins, so it is rebuilt around the new one
DROP VIEW product_listings;

ALTER TABLE vendor_snapshots
    ADD COLUMN province_code varchar(2);

CREATE VIEW product_listings AS
SELECT p.*,
       v.business_name AS vendor_name,
       v.owner_account_id,
       v.province_code,
       v.delivery_areas,
       v.local_delivery_fee,
       v.can_operate,
       v.sells_shop,
       v.accepts_orders AS vendor_accepts_orders
FROM product_views p
JOIN vendor_snapshots v ON v.vendor_id = p.vendor_id;
