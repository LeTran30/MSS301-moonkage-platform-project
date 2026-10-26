-- vendor_db: the unit price of a held line, fixed when it was held (BR-28), so a retried hold of the same checkout
-- answers the same price, and a price change while the buyer pays does not change what the checkout charges.
-- stock_reservations has no rows yet (phase 6), so the column is NOT NULL without a default.
ALTER TABLE stock_reservations ADD COLUMN unit_price bigint NOT NULL;
ALTER TABLE stock_reservations ADD CONSTRAINT ck_stock_reservations_unit_price CHECK (unit_price > 0);
