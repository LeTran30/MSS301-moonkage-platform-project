-- order_db: an order keeps the Shop's name and each line its cover image as they were on the day of the purchase,
-- like the product name and price it already keeps; the order pages need them and the catalog may change later.
-- Both stay null on rows written before this migration and when the source could not tell.

ALTER TABLE orders ADD COLUMN vendor_name varchar(255);
ALTER TABLE order_items ADD COLUMN image_key varchar(500);

-- the checkout carries them from the catalog snapshot to the orders made once the payment succeeds
ALTER TABLE checkout_groups ADD COLUMN vendor_name varchar(255);
ALTER TABLE checkout_lines ADD COLUMN image_key varchar(500);
