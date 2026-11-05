-- catalog_db: the legacy write model of products is gone for good (audit M-05; decisions L-04, L-18 and D-27).
--
-- Why this migration exists although the tables are already gone:
--   V2026_10_22_1000__align_with_api_db_outline.sql already dropped `products`, `product_price_tiers` and
--   `product_images` when catalog became a pure read model and the write model moved to vendor_db. So no database
--   that ran that migration has these tables any more - but the historical baseline V1__baseline.sql still
--   describes them, including the `deleted` column that L-04 removed. V1__baseline.sql must never be edited
--   (Flyway checks its checksum), so this new migration states the end state explicitly and idempotently.
--
-- Why the tables are genuinely dead and can be dropped again:
--   - no entity of catalog maps to them: `@EntityScan` covers only `com.moonkage.catalog.entity.readmodel`, and the
--     one entity there is `ProductListing`, which reads the `product_listings` view;
--   - no query of catalog reads them: the read model is `product_views` joined with `vendor_snapshots` through the
--     `product_listings` view, and `JdbcProductSearchRepository` only queries that view;
--   - the seed (`db/seed/R__seed.sql`) writes `vendor_snapshots` and `interprovince_fees` only - it never writes
--     a product, because products are written by vendor-service (L-18);
--   - catalog learns about a product from the `product.upserted` event, never from a table of its own, so there is
--     no sync job and no projection that reads `products`.
--
-- Why no CASCADE: the dependent tables are dropped first, and a table that still holds a foreign key to
-- `products` makes this migration fail loudly instead of silently dropping that table as well.

DROP TABLE IF EXISTS public.product_images;
DROP TABLE IF EXISTS public.product_price_tiers;
DROP TABLE IF EXISTS public.products;
