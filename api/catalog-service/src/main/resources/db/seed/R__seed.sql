-- Dev seed of catalog_db (docs/guides/database.md). Runs only where SPRING_FLYWAY_LOCATIONS adds classpath:db/seed, i.e.
-- docker-compose. Flyway runs it again whenever this file changes, so write every insert with ON CONFLICT DO NOTHING.
-- Use the fixed IDs of the registry in docs/guides/database.md; register new ones there first.
-- Products are written by vendor-service (L-18); product_views is filled from its events, never seeded here.

-- interprovince fees: one dev fee for every province (FR-52, A-18). Runs after R__provinces.sql (Flyway orders repeatable
-- migrations by description), so the provinces table is already filled.
INSERT INTO interprovince_fees (province_code, fee, effective_from)
SELECT code, 45000, now()
FROM provinces
ON CONFLICT DO NOTHING;
