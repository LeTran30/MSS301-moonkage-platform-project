-- Dev seed of catalog_db (docs/guides/database.md). Runs only where SPRING_FLYWAY_LOCATIONS adds classpath:db/seed, i.e.
-- docker-compose. Flyway runs it again whenever this file changes, so write every insert with ON CONFLICT DO NOTHING.
-- Use the fixed IDs of the registry in docs/guides/database.md; register new ones there first.
-- Products are written by vendor-service (L-18) and reach product_views through its events. The vendor seed writes its
-- rows straight into vendor_db and sends no event, so, like the vendors below, the seed products are copied here.

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

-- Read-model rows of the products seeded in vendor-service (same IDs and values, source_version 0 like a product
-- that was never edited). A later product.upserted has a higher version and replaces them.
INSERT INTO product_views (product_id, vendor_id, name, description, brand, origin, pieces_per_box, list_price, stock,
                           expiry_date, delivery_label, quote_threshold, status, crust_codes, filling_codes,
                           price_tiers, source_version)
VALUES ('00000000-0000-4000-8000-000300000001', '00000000-0000-4000-8000-000200000001', 'Bánh nướng thập cẩm đặc biệt (hộp 4 bánh)', 'Vỏ nướng vàng mỏng, nhân thập cẩm hạt dưa, mứt bí, lạp xưởng và trứng muối. Mỗi bánh 150 g, đóng hộp giấy cứng.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', 4, 320000, 120, '2026-12-20', 'NATIONWIDE', 100, 'ON_SALE', '{banh-nuong}', '{thap-cam}', '[{"fromQty": 10, "unitPrice": 304000}, {"fromQty": 50, "unitPrice": 288000}]'::jsonb, 0),
       ('00000000-0000-4000-8000-000300000002', '00000000-0000-4000-8000-000200000001', 'Bánh nướng đậu xanh trứng muối (hộp 2 bánh)', 'Nhân đậu xanh sên mịn, một hoặc hai lòng đỏ trứng muối. Mỗi bánh 180 g, ít ngọt.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', 2, 185000, 200, '2026-12-20', 'NATIONWIDE', 100, 'ON_SALE', '{banh-nuong}', '{dau-xanh,trung-muoi}', '[]'::jsonb, 0),
       ('00000000-0000-4000-8000-000300000003', '00000000-0000-4000-8000-000200000001', 'Bánh dẻo hạt sen (hộp 4 bánh)', 'Vỏ dẻo trắng mềm, nhân hạt sen Đồng Tháp bùi béo. Mỗi bánh 150 g, không chất bảo quản.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', 4, 295000, 90, '2026-12-05', 'NATIONWIDE', 100, 'ON_SALE', '{banh-deo}', '{hat-sen}', '[{"fromQty": 10, "unitPrice": 280000}]'::jsonb, 0),
       ('00000000-0000-4000-8000-000300000004', '00000000-0000-4000-8000-000200000001', 'Bánh dẻo khoai môn (hộp 4 bánh)', 'Vỏ dẻo, nhân khoai môn Lâm Đồng nghiền mịn, thơm mùi lá dứa. Giao nội thành trong ngày.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', 4, 265000, 60, '2026-11-25', 'LOCAL', NULL, 'ON_SALE', '{banh-deo}', '{khoai-mon}', '[]'::jsonb, 0),
       ('00000000-0000-4000-8000-000300000005', '00000000-0000-4000-8000-000200000001', 'Bánh lạnh trà xanh (hộp 4 bánh)', 'Bánh lạnh vỏ trong, nhân trà xanh matcha ít ngọt. Bảo quản ngăn mát, giao nội thành.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', 4, 350000, 40, '2026-11-20', 'LOCAL', NULL, 'ON_SALE', '{banh-lanh}', '{tra-xanh}', '[]'::jsonb, 0),
       ('00000000-0000-4000-8000-000300000006', '00000000-0000-4000-8000-000200000001', 'Bánh lạnh sầu riêng (hộp 4 bánh)', 'Bánh lạnh nhân sầu riêng Ri6 nguyên múi, béo thơm. Bảo quản ngăn mát, giao nội thành.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', 4, 380000, 35, '2026-11-20', 'LOCAL', NULL, 'ON_SALE', '{banh-lanh}', '{sau-rieng}', '[]'::jsonb, 0),
       ('00000000-0000-4000-8000-000300000007', '00000000-0000-4000-8000-000200000001', 'Hộp quà Trăng Vàng cao cấp (6 bánh phối vị)', 'Hộp gỗ sơn mài gồm 6 bánh nướng và dẻo: thập cẩm, hạt sen, trứng muối. Kèm túi quà và thiệp.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', 6, 580000, 50, '2026-12-31', 'NATIONWIDE', 100, 'ON_SALE', '{banh-nuong,banh-deo}', '{thap-cam,hat-sen,trung-muoi}', '[{"fromQty": 20, "unitPrice": 551000}]'::jsonb, 0),
       ('00000000-0000-4000-8000-000300000008', '00000000-0000-4000-8000-000200000001', 'Bánh nướng đậu đỏ Hương Việt (hộp 4 bánh)', 'Bánh nướng nhân đậu đỏ nghiền, vỏ mềm. Hàng nhập từ nhà sản xuất Hương Việt, bán lại.', 'Hương Việt', 'Việt Nam', 4, 245000, 150, '2027-01-15', 'NATIONWIDE', 100, 'ON_SALE', '{banh-nuong}', '{dau-do}', '[]'::jsonb, 0)
ON CONFLICT DO NOTHING;
