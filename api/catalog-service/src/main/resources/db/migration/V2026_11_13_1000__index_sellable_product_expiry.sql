-- Public reads keep the printed expiry date sellable, then stop exposing the product on the following day.
-- The projection row remains intact for replay/version ordering; this partial index supports the runtime filter.
CREATE INDEX ix_product_views_sellable_expiry
    ON product_views (expiry_date, delivery_label, vendor_id)
    WHERE status = 'ON_SALE';
