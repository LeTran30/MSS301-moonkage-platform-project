-- vendor_db: whether a product is resold (AC-29.2, AC-33.2). A vendor with supply source BOTH chooses it per
-- product; RESELL is always true, SELF_PRODUCED always false. It decides whether brand and origin are required, or
-- an empty brand becomes the vendor's business_name (BR-12, AC-29.4). products has no rows yet (L-18), so the column
-- is NOT NULL without a default.
ALTER TABLE products ADD COLUMN resold boolean NOT NULL;
