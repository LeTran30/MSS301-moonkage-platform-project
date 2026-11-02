-- Dev seed of catalog_db (docs/guides/database.md). Runs only where SPRING_FLYWAY_LOCATIONS adds classpath:db/seed, i.e.
-- docker-compose. Flyway runs it again whenever this file changes, so write every insert with ON CONFLICT DO NOTHING.
-- Use the fixed IDs of the registry in docs/guides/database.md; register new ones there first.
-- Products are written by vendor-service (L-18); product_views is filled from its events, never seeded here.

-- vendors: the copy of the two vendors of the vendor seed, which writes them straight into vendor_db and so never sends
-- vendor.updated. Same state and source_version 0 as there; a later vendor.updated (version 1+) replaces it. A row
-- still at version 0 came from this seed, so a re-run refreshes it (e.g. a column added since); a projected one stays.
INSERT INTO vendor_snapshots (vendor_id, owner_account_id, business_name, status, can_operate, sells_shop,
                              accepts_orders, delivery_areas, local_delivery_fee, source_version)
VALUES ('00000000-0000-4000-8000-000200000001', '00000000-0000-4000-8000-000100000004',
        'Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng', 'APPROVED', true, true, true, '{79}', 30000, 0),
       ('00000000-0000-4000-8000-000200000002', '00000000-0000-4000-8000-000100000005',
        'Hộ kinh doanh Bánh Quê', 'PENDING', false, true, false, '{01}', NULL, 0)
ON CONFLICT (vendor_id) DO UPDATE
SET owner_account_id = EXCLUDED.owner_account_id,
    business_name = EXCLUDED.business_name,
    status = EXCLUDED.status,
    can_operate = EXCLUDED.can_operate,
    sells_shop = EXCLUDED.sells_shop,
    accepts_orders = EXCLUDED.accepts_orders,
    delivery_areas = EXCLUDED.delivery_areas,
    local_delivery_fee = EXCLUDED.local_delivery_fee
WHERE vendor_snapshots.source_version = 0;

-- interprovince fees: one dev fee for every province (FR-52, A-18). Runs after R__provinces.sql (Flyway orders repeatable
-- migrations by description), so the provinces table is already filled.
INSERT INTO interprovince_fees (province_code, fee, effective_from)
SELECT code, 45000, now()
FROM provinces
ON CONFLICT DO NOTHING;
