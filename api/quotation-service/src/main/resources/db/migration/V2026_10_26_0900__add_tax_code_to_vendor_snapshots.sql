-- The binding acceptance names the vendor's tax code (quote_acceptances.vendor_tax_code, L-10), so the vendor copy
-- carries it too. Nullable: copies written before vendor.updated sends it have none, and acceptance refuses those.
ALTER TABLE vendor_snapshots ADD COLUMN tax_code varchar(20);
