-- Dev seed of catalog_db (docs/guides/database.md). Runs only where SPRING_FLYWAY_LOCATIONS adds classpath:db/seed, i.e.
-- docker-compose. Flyway runs it again whenever this file changes, so write every insert with ON CONFLICT DO NOTHING.
-- Use the fixed IDs of the registry in docs/guides/database.md; register new ones there first.
-- Products are written by vendor-service (L-18) and reach product_views through its events. The vendor seed writes its
-- rows straight into vendor_db and sends no event, so, like the vendors below, the seed products are copied here.

-- vendors: the copy of the two vendors of the vendor seed, which writes them straight into vendor_db and so never sends
-- vendor.updated. Same state and source_version 0 as there; a later vendor.updated (version 1+) replaces it. A row
-- still at version 0 came from this seed, so a re-run refreshes it (e.g. a column added since); a projected one stays.
INSERT INTO vendor_snapshots (vendor_id, owner_account_id, business_name, province_code, status, can_operate,
                              sells_shop, accepts_orders, delivery_areas, local_delivery_fee, source_version)
VALUES ('00000000-0000-4000-8000-000200000001', '00000000-0000-4000-8000-000100000004',
        'Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng', '79', 'APPROVED', true, true, true, '{79}', 30000, 0),
       ('00000000-0000-4000-8000-000200000002', '00000000-0000-4000-8000-000100000005',
        'Hộ kinh doanh Bánh Quê', '01', 'PENDING', false, true, false, '{01}', NULL, 0)
ON CONFLICT (vendor_id) DO UPDATE
SET owner_account_id = EXCLUDED.owner_account_id,
    business_name = EXCLUDED.business_name,
    province_code = EXCLUDED.province_code,
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

-- >>> DEMO DATA: generated by infra/dev/demo_seed.py; edit the script, not these lines
-- copies of the demo vendors and products of the vendor seed (same IDs and values, source_version 0)
INSERT INTO vendor_snapshots (vendor_id, owner_account_id, business_name, status, can_operate, sells_shop, accepts_orders, delivery_areas, local_delivery_fee, source_version)
VALUES ('00000000-0000-4000-8000-000200000003', '00000000-0000-4000-8000-000100000006', 'Hộ kinh doanh Bánh Dẻo Chợ Lớn', 'APPROVED', true, true, true, '{79}', 25000, 0),
       ('00000000-0000-4000-8000-000200000004', '00000000-0000-4000-8000-000100000007', 'Hộ kinh doanh Tiệm Bánh Cô Ba', 'APPROVED', true, true, false, '{79}', 20000, 0),
       ('00000000-0000-4000-8000-000200000005', '00000000-0000-4000-8000-000100000008', 'Doanh nghiệp tư nhân Quà Tặng Đoàn Viên', 'APPROVED', true, false, true, '{79}', 35000, 0),
       ('00000000-0000-4000-8000-000200000006', '00000000-0000-4000-8000-000100000009', 'Hộ kinh doanh Bánh Nhà Mây', 'APPROVED', true, true, true, '{79}', 30000, 0)
ON CONFLICT DO NOTHING;

INSERT INTO product_views (product_id, vendor_id, name, description, brand, origin, pieces_per_box, list_price, stock, expiry_date, delivery_label, quote_threshold, status, crust_codes, filling_codes, price_tiers, image_keys, source_version)
VALUES ('00000000-0000-4000-8000-000300000009', '00000000-0000-4000-8000-000200000003', 'Bánh dẻo đậu xanh lá dứa (hộp 4 bánh)', 'Vỏ dẻo xanh lá dứa, nhân đậu xanh sên mịn, vị ngọt thanh. Mỗi bánh 150 g, làm trong ngày, giao nội thành TP.HCM.', 'Bánh Dẻo Chợ Lớn', 'Thành phố Hồ Chí Minh', 4, 220000, 80, '2026-12-15', 'LOCAL', NULL, 'ON_SALE', '{banh-deo}', '{dau-xanh}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000003/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000010', '00000000-0000-4000-8000-000200000003', 'Bánh nướng thập cẩm gà quay (hộp 4 bánh)', 'Công thức người Hoa Chợ Lớn: nhân thập cẩm hạt dưa, lạp xưởng, mứt bí và gà quay xé sợi. Mỗi bánh 200 g, vỏ nướng hai lần.', 'Bánh Dẻo Chợ Lớn', 'Thành phố Hồ Chí Minh', 4, 360000, 120, '2027-01-10', 'NATIONWIDE', 100, 'ON_SALE', '{banh-nuong}', '{thap-cam}', '[{"fromQty": 10, "unitPrice": 342000}]'::jsonb, '{products/00000000-0000-4000-8000-000200000003/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000011', '00000000-0000-4000-8000-000200000003', 'Bánh dẻo thập cẩm truyền thống (1 bánh 250 g)', 'Bánh dẻo cỡ lớn nhân thập cẩm, gói giấy bóng kiếng như bánh Trung thu ngày xưa. Hợp mua lẻ để biếu.', 'Bánh Dẻo Chợ Lớn', 'Thành phố Hồ Chí Minh', 1, 75000, 150, '2026-12-15', 'LOCAL', NULL, 'ON_SALE', '{banh-deo}', '{thap-cam}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000003/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000012', '00000000-0000-4000-8000-000200000003', 'Bánh nướng hạt sen trứng muối (hộp 2 bánh)', 'Nhân hạt sen nghiền, một lòng đỏ trứng muối ở giữa. Mỗi bánh 180 g, đóng hộp thiếc, giữ được 60 ngày.', 'Bánh Dẻo Chợ Lớn', 'Thành phố Hồ Chí Minh', 2, 165000, 140, '2027-01-10', 'NATIONWIDE', 100, 'ON_SALE', '{banh-nuong}', '{hat-sen,trung-muoi}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000003/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000013', '00000000-0000-4000-8000-000200000003', 'Hộp quà Chợ Lớn (8 bánh phối vị)', 'Hộp gỗ khắc chữ gồm 4 bánh nướng và 4 bánh dẻo: thập cẩm, đậu xanh, hạt sen. Kèm trà ô long 50 g.', 'Bánh Dẻo Chợ Lớn', 'Thành phố Hồ Chí Minh', 8, 890000, 40, '2027-01-10', 'NATIONWIDE', 100, 'ON_SALE', '{banh-nuong,banh-deo}', '{thap-cam,dau-xanh,hat-sen}', '[{"fromQty": 20, "unitPrice": 845000}]'::jsonb, '{products/00000000-0000-4000-8000-000200000003/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000014', '00000000-0000-4000-8000-000200000004', 'Bánh nướng khoai môn (1 bánh 200 g)', 'Bánh nướng nhân khoai môn tím Đà Lạt, ít đường. Bán lẻ từng bánh, giao trong nội thành TP.HCM.', 'Tiệm Bánh Cô Ba', 'Thành phố Hồ Chí Minh', 1, 55000, 200, '2026-12-20', 'LOCAL', NULL, 'ON_SALE', '{banh-nuong}', '{khoai-mon}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000004/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000015', '00000000-0000-4000-8000-000200000004', 'Bánh dẻo sầu riêng (hộp 4 bánh)', 'Vỏ dẻo mềm, nhân sầu riêng Khánh Sơn béo thơm. Mỗi bánh 150 g, nên dùng trong 10 ngày.', 'Tiệm Bánh Cô Ba', 'Thành phố Hồ Chí Minh', 4, 310000, 60, '2026-11-30', 'LOCAL', NULL, 'ON_SALE', '{banh-deo}', '{sau-rieng}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000004/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000016', '00000000-0000-4000-8000-000200000004', 'Bánh nướng đậu đỏ (hộp 4 bánh)', 'Nhân đậu đỏ nấu mật mía, vỏ mỏng. Mỗi bánh 150 g, đóng hộp giấy kraft, giao toàn quốc.', 'Tiệm Bánh Cô Ba', 'Thành phố Hồ Chí Minh', 4, 195000, 110, '2027-01-05', 'NATIONWIDE', NULL, 'ON_SALE', '{banh-nuong}', '{dau-do}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000004/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000017', '00000000-0000-4000-8000-000200000004', 'Hộp bánh mini nhiều vị (12 bánh 50 g)', '12 bánh nướng nhỏ ba vị đậu xanh, đậu đỏ, trà xanh. Vừa một miếng, hợp làm quà cho trẻ nhỏ và văn phòng.', 'Tiệm Bánh Cô Ba', 'Thành phố Hồ Chí Minh', 12, 240000, 90, '2027-01-05', 'NATIONWIDE', NULL, 'ON_SALE', '{banh-nuong}', '{dau-xanh,dau-do,tra-xanh}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000004/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000018', '00000000-0000-4000-8000-000200000004', 'Bánh dẻo trà xanh (1 bánh 150 g)', 'Vỏ dẻo trà xanh Bảo Lộc, nhân đậu xanh. Bán lẻ từng bánh, giao trong ngày ở TP.HCM.', 'Tiệm Bánh Cô Ba', 'Thành phố Hồ Chí Minh', 1, 45000, 180, '2026-12-10', 'LOCAL', NULL, 'ON_SALE', '{banh-deo}', '{tra-xanh,dau-xanh}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000004/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000019', '00000000-0000-4000-8000-000200000006', 'Bánh lạnh phô mai trà xanh (hộp 4 bánh)', 'Bánh lạnh vỏ trong, nhân phô mai kem và matcha. Bảo quản ngăn mát, giao nội thành TP.HCM trong 2 giờ.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', 4, 360000, 45, '2026-11-28', 'LOCAL', NULL, 'ON_SALE', '{banh-lanh}', '{tra-xanh}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000006/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000020', '00000000-0000-4000-8000-000200000006', 'Bánh lạnh sầu riêng (hộp 6 bánh)', 'Bánh lạnh nhân sầu riêng Ri6 nguyên múi. Mỗi bánh 120 g, bảo quản ngăn mát, giao nội thành.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', 6, 520000, 35, '2026-11-28', 'LOCAL', NULL, 'ON_SALE', '{banh-lanh}', '{sau-rieng}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000006/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000021', '00000000-0000-4000-8000-000200000006', 'Bánh nướng trứng muối tan chảy (hộp 4 bánh)', 'Nhân sốt trứng muối chảy khi hâm nóng 10 giây. Mỗi bánh 120 g, bảo quản ngăn mát 30 ngày.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', 4, 420000, 70, '2026-12-30', 'NATIONWIDE', 100, 'ON_SALE', '{banh-nuong}', '{trung-muoi}', '[{"fromQty": 10, "unitPrice": 399000}]'::jsonb, '{products/00000000-0000-4000-8000-000200000006/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000022', '00000000-0000-4000-8000-000200000006', 'Bánh nướng chay đậu xanh (hộp 4 bánh)', 'Không dùng mỡ động vật và trứng, nhân đậu xanh hạt sen. Hợp người ăn chay, mỗi bánh 150 g.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', 4, 260000, 90, '2027-01-05', 'NATIONWIDE', 100, 'ON_SALE', '{banh-nuong}', '{dau-xanh,hat-sen}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000006/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000023', '00000000-0000-4000-8000-000200000006', 'Hộp quà doanh nghiệp Nhà Mây (6 bánh và trà)', 'Hộp sơn mài 6 bánh nướng và dẻo, kèm trà ô long 100 g và thiệp in logo theo yêu cầu. Đặt từ 50 hộp có giá riêng.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', 6, 1500000, 30, '2027-01-15', 'NATIONWIDE', 100, 'ON_SALE', '{banh-nuong,banh-deo}', '{thap-cam,trung-muoi,hat-sen}', '[{"fromQty": 20, "unitPrice": 1425000}]'::jsonb, '{products/00000000-0000-4000-8000-000200000006/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000024', '00000000-0000-4000-8000-000200000006', 'Bánh nướng hạt sen Sen Hồng (hộp 4 bánh)', 'Hàng nhập từ cơ sở Sen Hồng ở Đồng Tháp, Nhà Mây bán lại. Nhân hạt sen tươi, mỗi bánh 160 g.', 'Sen Hồng', 'Tỉnh Đồng Tháp', 4, 230000, 100, '2027-01-05', 'NATIONWIDE', 100, 'ON_SALE', '{banh-nuong}', '{hat-sen}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000006/mk-1.jpg}', 0),
       ('00000000-0000-4000-8000-000300000025', '00000000-0000-4000-8000-000200000006', 'Bánh dẻo khoai môn (1 bánh 180 g)', 'Vỏ dẻo tím, nhân khoai môn Đà Lạt. Bán lẻ từng bánh, giao nội thành TP.HCM.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', 1, 65000, 160, '2026-12-10', 'LOCAL', NULL, 'ON_SALE', '{banh-deo}', '{khoai-mon}', '[]'::jsonb, '{products/00000000-0000-4000-8000-000200000006/mk-1.jpg}', 0)
ON CONFLICT DO NOTHING;

-- the same photo keys for the hand-written products 1-8, while they are still at version 0
UPDATE product_views v
SET image_keys = i.keys::text[]
FROM (VALUES ('00000000-0000-4000-8000-000300000001', '{products/00000000-0000-4000-8000-000200000001/mk-1.jpg}'),
       ('00000000-0000-4000-8000-000300000002', '{products/00000000-0000-4000-8000-000200000001/mk-1.jpg}'),
       ('00000000-0000-4000-8000-000300000003', '{products/00000000-0000-4000-8000-000200000001/mk-1.jpg}'),
       ('00000000-0000-4000-8000-000300000004', '{products/00000000-0000-4000-8000-000200000001/mk-1.jpg}'),
       ('00000000-0000-4000-8000-000300000005', '{products/00000000-0000-4000-8000-000200000001/mk-1.jpg}'),
       ('00000000-0000-4000-8000-000300000006', '{products/00000000-0000-4000-8000-000200000001/mk-1.jpg}'),
       ('00000000-0000-4000-8000-000300000007', '{products/00000000-0000-4000-8000-000200000001/mk-1.jpg}'),
       ('00000000-0000-4000-8000-000300000008', '{products/00000000-0000-4000-8000-000200000001/mk-1.jpg}')) AS i (product_id, keys)
WHERE v.product_id = i.product_id AND v.source_version = 0 AND v.image_keys = '{}';

-- reviews of the demo orders (order seed), and the rating they give each product still at version 0
INSERT INTO product_reviews (review_id, product_id, vendor_id, rating, content, created_at)
VALUES ('d90b52b7-8d18-3f88-8ef9-7a091401b8d0', '00000000-0000-4000-8000-000300000012', '00000000-0000-4000-8000-000200000003', 2, 'Bánh bị vỡ hai cái khi nhận, shop đã hỗ trợ đổi.', now() - interval '37181 minutes'),
       ('93344925-e8bf-8404-1f00-4aa6a2d15ab6', '00000000-0000-4000-8000-000300000011', '00000000-0000-4000-8000-000200000003', 4, 'Bánh ngon, chỉ tiếc hộp bị móp nhẹ một góc.', now() - interval '37181 minutes'),
       ('3837cbc1-0790-96b1-117c-34edd896d45f', '00000000-0000-4000-8000-000300000004', '00000000-0000-4000-8000-000200000001', 5, 'Shop tư vấn nhiệt tình, bánh còn ấm khi nhận.', now() - interval '36956 minutes'),
       ('d1f25cbb-cd4a-6563-ed1b-57b615210135', '00000000-0000-4000-8000-000300000002', '00000000-0000-4000-8000-000200000001', 4, 'Bánh ngon, chỉ tiếc hộp bị móp nhẹ một góc.', now() - interval '36956 minutes'),
       ('46622eb0-838c-5f60-93f9-04713277e56e', '00000000-0000-4000-8000-000300000016', '00000000-0000-4000-8000-000200000004', 5, 'Shop tư vấn nhiệt tình, bánh còn ấm khi nhận.', now() - interval '33979 minutes'),
       ('7d03a14d-3019-a215-b821-a79054bc5130', '00000000-0000-4000-8000-000300000004', '00000000-0000-4000-8000-000200000001', 3, 'Bánh tạm được, vỏ hơi khô so với mong đợi.', now() - interval '35826 minutes'),
       ('caac7afd-286b-1a35-c731-ef7d02440fbd', '00000000-0000-4000-8000-000300000017', '00000000-0000-4000-8000-000200000004', 3, 'Bánh tạm được, vỏ hơi khô so với mong đợi.', now() - interval '33888 minutes'),
       ('eba60ca2-34fa-9592-0e3d-088e0190b908', '00000000-0000-4000-8000-000300000016', '00000000-0000-4000-8000-000200000004', 2, 'Bánh bị vỡ hai cái khi nhận, shop đã hỗ trợ đổi.', now() - interval '33888 minutes'),
       ('4c953e35-8070-e7ce-f4dd-dee3a6581752', '00000000-0000-4000-8000-000300000005', '00000000-0000-4000-8000-000200000001', 4, 'Giao hơi trễ một chút nhưng bánh vẫn ngon.', now() - interval '31300 minutes'),
       ('53b2dfd0-e8ee-ac80-f199-93a4a5b42568', '00000000-0000-4000-8000-000300000001', '00000000-0000-4000-8000-000200000001', 4, 'Vị ổn, hơi ngọt so với mình nhưng ba mẹ rất thích.', now() - interval '31300 minutes'),
       ('9045ecc4-31b5-3d7c-cc15-c114677ca1d6', '00000000-0000-4000-8000-000300000016', '00000000-0000-4000-8000-000200000004', 5, 'Vị truyền thống đúng kiểu ngày xưa, ăn không bị ngấy.', now() - interval '29349 minutes'),
       ('d8aacda7-e1f1-04f2-e90e-dd5f7c563a3d', '00000000-0000-4000-8000-000300000014', '00000000-0000-4000-8000-000200000004', 5, 'Bánh thơm, vỏ mỏng, nhân không quá ngọt. Cả nhà đều khen.', now() - interval '27993 minutes'),
       ('53105b09-a24a-7af6-cb08-38a4bb2aa51e', '00000000-0000-4000-8000-000300000016', '00000000-0000-4000-8000-000200000004', 2, 'Bánh bị vỡ hai cái khi nhận, shop đã hỗ trợ đổi.', now() - interval '27993 minutes'),
       ('85fe7943-7b91-ab72-b6c8-ed49284869d4', '00000000-0000-4000-8000-000300000023', '00000000-0000-4000-8000-000200000006', 5, 'Vị truyền thống đúng kiểu ngày xưa, ăn không bị ngấy.', now() - interval '27795 minutes'),
       ('45fee13e-750d-0d20-482a-7e947351b2fe', '00000000-0000-4000-8000-000300000019', '00000000-0000-4000-8000-000200000006', 5, 'Nhân đầy đặn, trứng muối béo. Năm sau sẽ đặt tiếp.', now() - interval '27795 minutes'),
       ('813596aa-d485-7292-f84b-c58904506379', '00000000-0000-4000-8000-000300000018', '00000000-0000-4000-8000-000200000004', 4, 'Giao hơi trễ một chút nhưng bánh vẫn ngon.', now() - interval '26495 minutes'),
       ('4cc7e999-9546-3e15-c60d-79552f2f0502', '00000000-0000-4000-8000-000300000012', '00000000-0000-4000-8000-000200000003', 5, 'Nhân đầy đặn, trứng muối béo. Năm sau sẽ đặt tiếp.', now() - interval '24311 minutes'),
       ('ea26da9f-e964-e95c-17d5-943f266b40d9', '00000000-0000-4000-8000-000300000011', '00000000-0000-4000-8000-000200000003', 5, 'Shop tư vấn nhiệt tình, bánh còn ấm khi nhận.', now() - interval '24311 minutes'),
       ('83dcc141-59f3-0568-8f93-bdb8422def0f', '00000000-0000-4000-8000-000300000002', '00000000-0000-4000-8000-000200000001', 5, 'Vị truyền thống đúng kiểu ngày xưa, ăn không bị ngấy.', now() - interval '16727 minutes'),
       ('404a337f-5a17-7af5-ed94-7fa17ec4fd59', '00000000-0000-4000-8000-000300000010', '00000000-0000-4000-8000-000200000003', 5, 'Nhân đầy đặn, trứng muối béo. Năm sau sẽ đặt tiếp.', now() - interval '16291 minutes'),
       ('aa2b0f30-d850-e946-256d-6ccac6ecc552', '00000000-0000-4000-8000-000300000005', '00000000-0000-4000-8000-000200000001', 5, 'Nhân đầy đặn, trứng muối béo. Năm sau sẽ đặt tiếp.', now() - interval '14949 minutes'),
       ('e627e998-bcd3-7e4b-57a1-cd0e20a85063', '00000000-0000-4000-8000-000300000003', '00000000-0000-4000-8000-000200000001', 5, 'Shop tư vấn nhiệt tình, bánh còn ấm khi nhận.', now() - interval '14949 minutes'),
       ('f0697862-dc72-bce7-c61d-642021e5b938', '00000000-0000-4000-8000-000300000001', '00000000-0000-4000-8000-000200000001', 4, 'Bánh ngon, chỉ tiếc hộp bị móp nhẹ một góc.', now() - interval '12705 minutes'),
       ('3aaf5f0f-7acb-d3a1-634d-b20a65c39c48', '00000000-0000-4000-8000-000300000004', '00000000-0000-4000-8000-000200000001', 5, 'Bánh thơm, vỏ mỏng, nhân không quá ngọt. Cả nhà đều khen.', now() - interval '12705 minutes'),
       ('0b41748c-adc4-35e3-6bc3-7d7ce3110b63', '00000000-0000-4000-8000-000300000011', '00000000-0000-4000-8000-000200000003', 4, 'Bánh ngon, chỉ tiếc hộp bị móp nhẹ một góc.', now() - interval '12126 minutes'),
       ('e0a0acc4-62f6-6eb6-7829-cd9e9fcf5cba', '00000000-0000-4000-8000-000300000012', '00000000-0000-4000-8000-000200000003', 5, 'Vị truyền thống đúng kiểu ngày xưa, ăn không bị ngấy.', now() - interval '12126 minutes'),
       ('be70d9bd-8def-9d0a-e28d-ed28b7d48557', '00000000-0000-4000-8000-000300000002', '00000000-0000-4000-8000-000200000001', 4, 'Vị ổn, hơi ngọt so với mình nhưng ba mẹ rất thích.', now() - interval '8080 minutes'),
       ('f3bb6833-1e5e-337c-f5f0-23e15e8ab371', '00000000-0000-4000-8000-000300000011', '00000000-0000-4000-8000-000200000003', 3, 'Nhân ít hơn hình, nhưng vị không tệ.', now() - interval '7954 minutes'),
       ('13f3efa6-73df-0585-aae5-1c04284a08de', '00000000-0000-4000-8000-000300000011', '00000000-0000-4000-8000-000200000003', 4, 'Ngon, giá hợp lý. Mong shop có thêm vị mới.', now() - interval '5599 minutes')
ON CONFLICT DO NOTHING;

UPDATE product_views v
SET rating_avg = r.avg, rating_count = r.count
FROM (SELECT product_id, round(avg(rating), 2) AS avg, count(*) AS count FROM product_reviews GROUP BY product_id) r
WHERE v.product_id = r.product_id AND v.source_version = 0 AND v.rating_count IS DISTINCT FROM r.count;
-- <<< DEMO DATA
