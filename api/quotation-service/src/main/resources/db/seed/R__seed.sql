-- Dev seed of quotation_db (docs/guides/database.md). Runs only where SPRING_FLYWAY_LOCATIONS adds classpath:db/seed, i.e.
-- docker-compose. Flyway runs it again whenever this file changes, so write every insert with ON CONFLICT DO NOTHING.
-- Use the fixed IDs of the registry in docs/guides/database.md; register new ones there first.

-- Vendor copies of the two seed vendors of vendor-service, as vendor.updated would write them. Until vendor-service
-- publishes that event this is the only source, so it mirrors vendor-service's seed by hand.
-- Trăng Vàng (member4): approved, fee paid, takes custom orders from 50 boxes; delivers in Hồ Chí Minh City (79).
-- Bánh Quê (member5): still waiting for review, so it cannot operate and is never invited (BR-16, BR-31).
INSERT INTO vendor_snapshots (vendor_id, owner_account_id, business_name, tax_code, status, can_operate, sells_shop,
                              accepts_orders, supply_source, delivery_areas, min_qty, ref_price_tiers, lead_time_days,
                              custom_capabilities, early_bird_offer, production_profile, source_version, updated_at)
VALUES ('00000000-0000-4000-8000-000200000001', '00000000-0000-4000-8000-000100000004',
        'Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng', '0312345678', 'APPROVED', true, true,
        true, 'BOTH', '{79}', 50,
        '[{"fromQty": 50, "unitPrice": 120000}, {"fromQty": 200, "unitPrice": 105000}, {"fromQty": 500, "unitPrice": 95000}]',
        14, '{BAG,CARD,STICKER}', 'Giảm 5% cho đơn đặt trước ngày 15/8', '{"weeklyCapacity": 2000}', 0, now()),
       ('00000000-0000-4000-8000-000200000002', '00000000-0000-4000-8000-000100000005',
        'Hộ kinh doanh Bánh Quê', '8012345678', 'PENDING', false, true,
        false, 'SELF_PRODUCED', '{01}', NULL, '[]', NULL, '{}', NULL, '{}', 0, now())
ON CONFLICT DO NOTHING;
