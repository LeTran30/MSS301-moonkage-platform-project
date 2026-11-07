-- Dev seed of vendor_db (docs/guides/database.md). Runs only where SPRING_FLYWAY_LOCATIONS adds classpath:db/seed, i.e.
-- docker-compose. Flyway runs it again whenever this file changes, so every insert skips rows that already exist.
-- Owners are the seed accounts of identity-service; IDs come from the registry in docs/guides/database.md.
-- Companies do not register through the system (BR-33), so both seed vendors are owner-run units (BR-27).
-- representative_id_* stay empty: the keyed hash needs identity-service's pepper, which SQL does not have.
-- Bank account numbers are seeded masked only: SQL cannot encrypt them (bank_account_number_enc stays empty).

INSERT INTO vendors (id, owner_account_id, business_name, entity_type, tax_code, address, province_code,
                     representative_name, bank_name, bank_account_masked, bank_account_holder,
                     supply_source, sells_shop, accepts_orders, status, local_delivery_fee,
                     registration_fee_amount, registration_fee_paid_at, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000200000001', '00000000-0000-4000-8000-000100000004',
        'Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng', 'SOLE_PROPRIETORSHIP', '0312345678',
        '123 Nguyễn Trãi, Thành phố Hồ Chí Minh', '79', 'PHAM VAN BANH',
        'Vietcombank', '*********3456', 'DNTN BANH TRUNG THU TRANG VANG',
        'BOTH', true, true, 'APPROVED', 30000,
        200000, now(), now(), now()),
       ('00000000-0000-4000-8000-000200000002', '00000000-0000-4000-8000-000100000005',
        'Hộ kinh doanh Bánh Quê', 'HOUSEHOLD_BUSINESS', '8012345678',
        '45 Trần Phú, Thành phố Hà Nội', '01', 'VO THI QUE',
        'Agribank', '*********3456', 'VO THI QUE',
        'SELF_PRODUCED', true, false, 'PENDING', NULL,
        NULL, NULL, now(), now())
ON CONFLICT DO NOTHING;

-- delivery area = province code (Q-12)
INSERT INTO vendor_delivery_areas (id, vendor_id, province_code)
VALUES ('00000000-0000-4000-8000-000700000001', '00000000-0000-4000-8000-000200000001', '79'),
       ('00000000-0000-4000-8000-000700000002', '00000000-0000-4000-8000-000200000002', '01')
ON CONFLICT DO NOTHING;

-- dev databases created before BR-33 still carry the old company name of the first seed vendor
UPDATE vendors
SET business_name = 'Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng',
    bank_account_holder = 'DNTN BANH TRUNG THU TRANG VANG',
    representative_name = coalesce(representative_name, 'PHAM VAN BANH'),
    local_delivery_fee = coalesce(local_delivery_fee, 30000),
    registration_fee_amount = coalesce(registration_fee_amount, 200000),
    registration_fee_paid_at = coalesce(registration_fee_paid_at, now())
WHERE id = '00000000-0000-4000-8000-000200000001'
  AND business_name = 'Công ty TNHH Bánh Trung Thu Trăng Vàng';
UPDATE vendors
SET representative_name = 'VO THI QUE'
WHERE id = '00000000-0000-4000-8000-000200000002' AND representative_name IS NULL;

-- ---------------------------------------------------------------------------------------------------------------
-- Shop products of Trăng Vàng (member4), ON_SALE: what the buyer sees on the catalog pages. Written here (L-18); the
-- same rows sit in catalog-service's seed as product_views, so the pages show them without waiting for an event.
-- Both seeds use the product IDs of the registry in docs/guides/database.md (type 0003). No images: image_keys are
-- object keys of the MinIO public bucket and the seed has no files to upload; the shop shows its placeholder.
-- ---------------------------------------------------------------------------------------------------------------
INSERT INTO products (id, vendor_id, name, description, brand, origin, resold, pieces_per_box, list_price, stock,
                      expiry_date, delivery_label, quote_threshold, status, version)
VALUES ('00000000-0000-4000-8000-000300000001', '00000000-0000-4000-8000-000200000001', 'Bánh nướng thập cẩm đặc biệt (hộp 4 bánh)', 'Vỏ nướng vàng mỏng, nhân thập cẩm hạt dưa, mứt bí, lạp xưởng và trứng muối. Mỗi bánh 150 g, đóng hộp giấy cứng.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', false, 4, 320000, 120, '2026-12-20', 'NATIONWIDE', 100, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000002', '00000000-0000-4000-8000-000200000001', 'Bánh nướng đậu xanh trứng muối (hộp 2 bánh)', 'Nhân đậu xanh sên mịn, một hoặc hai lòng đỏ trứng muối. Mỗi bánh 180 g, ít ngọt.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', false, 2, 185000, 200, '2026-12-20', 'NATIONWIDE', 100, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000003', '00000000-0000-4000-8000-000200000001', 'Bánh dẻo hạt sen (hộp 4 bánh)', 'Vỏ dẻo trắng mềm, nhân hạt sen Đồng Tháp bùi béo. Mỗi bánh 150 g, không chất bảo quản.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', false, 4, 295000, 90, '2026-12-05', 'NATIONWIDE', 100, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000004', '00000000-0000-4000-8000-000200000001', 'Bánh dẻo khoai môn (hộp 4 bánh)', 'Vỏ dẻo, nhân khoai môn Lâm Đồng nghiền mịn, thơm mùi lá dứa. Giao nội thành trong ngày.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', false, 4, 265000, 60, '2026-11-25', 'LOCAL', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000005', '00000000-0000-4000-8000-000200000001', 'Bánh lạnh trà xanh (hộp 4 bánh)', 'Bánh lạnh vỏ trong, nhân trà xanh matcha ít ngọt. Bảo quản ngăn mát, giao nội thành.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', false, 4, 350000, 40, '2026-11-20', 'LOCAL', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000006', '00000000-0000-4000-8000-000200000001', 'Bánh lạnh sầu riêng (hộp 4 bánh)', 'Bánh lạnh nhân sầu riêng Ri6 nguyên múi, béo thơm. Bảo quản ngăn mát, giao nội thành.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', false, 4, 380000, 35, '2026-11-20', 'LOCAL', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000007', '00000000-0000-4000-8000-000200000001', 'Hộp quà Trăng Vàng cao cấp (6 bánh phối vị)', 'Hộp gỗ sơn mài gồm 6 bánh nướng và dẻo: thập cẩm, hạt sen, trứng muối. Kèm túi quà và thiệp.', 'Bánh Trung Thu Trăng Vàng', 'Thành phố Hồ Chí Minh', false, 6, 580000, 50, '2026-12-31', 'NATIONWIDE', 100, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000008', '00000000-0000-4000-8000-000200000001', 'Bánh nướng đậu đỏ Hương Việt (hộp 4 bánh)', 'Bánh nướng nhân đậu đỏ nghiền, vỏ mềm. Hàng nhập từ nhà sản xuất Hương Việt, bán lại.', 'Hương Việt', 'Việt Nam', true, 4, 245000, 150, '2027-01-15', 'NATIONWIDE', 100, 'ON_SALE', 0)
ON CONFLICT DO NOTHING;

INSERT INTO product_cake_attributes (product_id, attribute_id)
VALUES ('00000000-0000-4000-8000-000300000001', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000001', 'a1f0c0de-0000-4000-8000-000000000201'),
       ('00000000-0000-4000-8000-000300000002', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000002', 'a1f0c0de-0000-4000-8000-000000000202'),
       ('00000000-0000-4000-8000-000300000002', 'a1f0c0de-0000-4000-8000-000000000208'),
       ('00000000-0000-4000-8000-000300000003', 'a1f0c0de-0000-4000-8000-000000000102'),
       ('00000000-0000-4000-8000-000300000003', 'a1f0c0de-0000-4000-8000-000000000203'),
       ('00000000-0000-4000-8000-000300000004', 'a1f0c0de-0000-4000-8000-000000000102'),
       ('00000000-0000-4000-8000-000300000004', 'a1f0c0de-0000-4000-8000-000000000205'),
       ('00000000-0000-4000-8000-000300000005', 'a1f0c0de-0000-4000-8000-000000000103'),
       ('00000000-0000-4000-8000-000300000005', 'a1f0c0de-0000-4000-8000-000000000206'),
       ('00000000-0000-4000-8000-000300000006', 'a1f0c0de-0000-4000-8000-000000000103'),
       ('00000000-0000-4000-8000-000300000006', 'a1f0c0de-0000-4000-8000-000000000207'),
       ('00000000-0000-4000-8000-000300000007', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000007', 'a1f0c0de-0000-4000-8000-000000000102'),
       ('00000000-0000-4000-8000-000300000007', 'a1f0c0de-0000-4000-8000-000000000201'),
       ('00000000-0000-4000-8000-000300000007', 'a1f0c0de-0000-4000-8000-000000000203'),
       ('00000000-0000-4000-8000-000300000007', 'a1f0c0de-0000-4000-8000-000000000208'),
       ('00000000-0000-4000-8000-000300000008', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000008', 'a1f0c0de-0000-4000-8000-000000000204')
ON CONFLICT DO NOTHING;

-- price tiers (BR-35): the unit price from a quantity upwards; the id is derived so a second run finds the same row
INSERT INTO product_price_tiers (id, product_id, from_qty, unit_price)
SELECT md5(t.product_id || ':' || t.from_qty)::uuid::text, t.product_id, t.from_qty, t.unit_price
FROM (VALUES ('00000000-0000-4000-8000-000300000001', 10, 304000),
             ('00000000-0000-4000-8000-000300000001', 50, 288000),
             ('00000000-0000-4000-8000-000300000003', 10, 280000),
             ('00000000-0000-4000-8000-000300000007', 20, 551000)) AS t (product_id, from_qty, unit_price)
ON CONFLICT DO NOTHING;

-- >>> DEMO DATA: generated by infra/dev/demo_seed.py; edit the script, not these lines
-- four more approved vendors, all in TP.HCM like the buyers of the demo: two shops, a shop-only one and an order-only one (BR-21)
INSERT INTO vendors (id, owner_account_id, business_name, entity_type, tax_code, address, province_code, representative_name, bank_name, bank_account_masked, bank_account_holder, supply_source, sells_shop, accepts_orders, status, local_delivery_fee, registration_fee_amount, registration_fee_paid_at, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000200000003', '00000000-0000-4000-8000-000100000006', 'Hộ kinh doanh Bánh Dẻo Chợ Lớn', 'HOUSEHOLD_BUSINESS', '8034567890', '56 Hải Thượng Lãn Ông, Phường Chợ Lớn, Thành phố Hồ Chí Minh', '79', 'DO MINH TAM', 'BIDV', '*********7890', 'DO MINH TAM', 'SELF_PRODUCED', true, true, 'APPROVED', 25000, 200000, now() - interval '57600 minutes', now() - interval '64800 minutes', now() - interval '57600 minutes'),
       ('00000000-0000-4000-8000-000200000004', '00000000-0000-4000-8000-000100000007', 'Hộ kinh doanh Tiệm Bánh Cô Ba', 'HOUSEHOLD_BUSINESS', '0401234567', '17 Nguyễn Thiện Thuật, Phường Bàn Cờ, Thành phố Hồ Chí Minh', '79', 'HOANG THI BA', 'Techcombank', '*********4567', 'HOANG THI BA', 'SELF_PRODUCED', true, false, 'APPROVED', 20000, 200000, now() - interval '57600 minutes', now() - interval '64800 minutes', now() - interval '57600 minutes'),
       ('00000000-0000-4000-8000-000200000005', '00000000-0000-4000-8000-000100000008', 'Doanh nghiệp tư nhân Quà Tặng Đoàn Viên', 'SOLE_PROPRIETORSHIP', '0109876543', '102 Cộng Hòa, Phường Tân Bình, Thành phố Hồ Chí Minh', '79', 'BUI QUANG HUY', 'VietinBank', '*********6543', 'BUI QUANG HUY', 'BOTH', false, true, 'APPROVED', 35000, 200000, now() - interval '57600 minutes', now() - interval '64800 minutes', now() - interval '57600 minutes'),
       ('00000000-0000-4000-8000-000200000006', '00000000-0000-4000-8000-000100000009', 'Hộ kinh doanh Bánh Nhà Mây', 'HOUSEHOLD_BUSINESS', '0317654321', '41 Võ Văn Tần, Phường Xuân Hòa, Thành phố Hồ Chí Minh', '79', 'NGO THANH MAY', 'ACB', '*********4321', 'NGO THANH MAY', 'BOTH', true, true, 'APPROVED', 30000, 200000, now() - interval '57600 minutes', now() - interval '64800 minutes', now() - interval '57600 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO vendor_delivery_areas (id, vendor_id, province_code)
VALUES ('00000000-0000-4000-8000-000700000003', '00000000-0000-4000-8000-000200000003', '79'),
       ('00000000-0000-4000-8000-000700000004', '00000000-0000-4000-8000-000200000004', '79'),
       ('00000000-0000-4000-8000-000700000005', '00000000-0000-4000-8000-000200000005', '79'),
       ('00000000-0000-4000-8000-000700000006', '00000000-0000-4000-8000-000200000006', '79')
ON CONFLICT DO NOTHING;

INSERT INTO vendor_reviews (id, vendor_id, admin_account_id, decision, reason, license_checked, registry_checked, decided_at)
VALUES ('b16462b1-76ab-eda3-b31f-b6c81870263d', '00000000-0000-4000-8000-000200000003', '00000000-0000-4000-8000-000100000000', 'APPROVE', NULL, true, true, now() - interval '59040 minutes'),
       ('d74a07d7-8be2-4b9b-8a31-ebca36e81e34', '00000000-0000-4000-8000-000200000004', '00000000-0000-4000-8000-000100000000', 'APPROVE', NULL, true, true, now() - interval '59040 minutes'),
       ('bc654756-af28-9dcc-d914-faf2494569a4', '00000000-0000-4000-8000-000200000005', '00000000-0000-4000-8000-000100000000', 'APPROVE', NULL, true, true, now() - interval '59040 minutes'),
       ('fbf57a2e-5f76-19d1-6c9d-a6bab7ff7f75', '00000000-0000-4000-8000-000200000006', '00000000-0000-4000-8000-000100000000', 'APPROVE', NULL, true, true, now() - interval '59040 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO products (id, vendor_id, name, description, brand, origin, resold, pieces_per_box, list_price, stock, expiry_date, delivery_label, quote_threshold, status, version)
VALUES ('00000000-0000-4000-8000-000300000009', '00000000-0000-4000-8000-000200000003', 'Bánh dẻo đậu xanh lá dứa (hộp 4 bánh)', 'Vỏ dẻo xanh lá dứa, nhân đậu xanh sên mịn, vị ngọt thanh. Mỗi bánh 150 g, làm trong ngày, giao nội thành TP.HCM.', 'Bánh Dẻo Chợ Lớn', 'Thành phố Hồ Chí Minh', false, 4, 220000, 80, '2026-12-15', 'LOCAL', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000010', '00000000-0000-4000-8000-000200000003', 'Bánh nướng thập cẩm gà quay (hộp 4 bánh)', 'Công thức người Hoa Chợ Lớn: nhân thập cẩm hạt dưa, lạp xưởng, mứt bí và gà quay xé sợi. Mỗi bánh 200 g, vỏ nướng hai lần.', 'Bánh Dẻo Chợ Lớn', 'Thành phố Hồ Chí Minh', false, 4, 360000, 120, '2027-01-10', 'NATIONWIDE', 100, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000011', '00000000-0000-4000-8000-000200000003', 'Bánh dẻo thập cẩm truyền thống (1 bánh 250 g)', 'Bánh dẻo cỡ lớn nhân thập cẩm, gói giấy bóng kiếng như bánh Trung thu ngày xưa. Hợp mua lẻ để biếu.', 'Bánh Dẻo Chợ Lớn', 'Thành phố Hồ Chí Minh', false, 1, 75000, 150, '2026-12-15', 'LOCAL', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000012', '00000000-0000-4000-8000-000200000003', 'Bánh nướng hạt sen trứng muối (hộp 2 bánh)', 'Nhân hạt sen nghiền, một lòng đỏ trứng muối ở giữa. Mỗi bánh 180 g, đóng hộp thiếc, giữ được 60 ngày.', 'Bánh Dẻo Chợ Lớn', 'Thành phố Hồ Chí Minh', false, 2, 165000, 140, '2027-01-10', 'NATIONWIDE', 100, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000013', '00000000-0000-4000-8000-000200000003', 'Hộp quà Chợ Lớn (8 bánh phối vị)', 'Hộp gỗ khắc chữ gồm 4 bánh nướng và 4 bánh dẻo: thập cẩm, đậu xanh, hạt sen. Kèm trà ô long 50 g.', 'Bánh Dẻo Chợ Lớn', 'Thành phố Hồ Chí Minh', false, 8, 890000, 40, '2027-01-10', 'NATIONWIDE', 100, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000014', '00000000-0000-4000-8000-000200000004', 'Bánh nướng khoai môn (1 bánh 200 g)', 'Bánh nướng nhân khoai môn tím Đà Lạt, ít đường. Bán lẻ từng bánh, giao trong nội thành TP.HCM.', 'Tiệm Bánh Cô Ba', 'Thành phố Hồ Chí Minh', false, 1, 55000, 200, '2026-12-20', 'LOCAL', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000015', '00000000-0000-4000-8000-000200000004', 'Bánh dẻo sầu riêng (hộp 4 bánh)', 'Vỏ dẻo mềm, nhân sầu riêng Khánh Sơn béo thơm. Mỗi bánh 150 g, nên dùng trong 10 ngày.', 'Tiệm Bánh Cô Ba', 'Thành phố Hồ Chí Minh', false, 4, 310000, 60, '2026-11-30', 'LOCAL', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000016', '00000000-0000-4000-8000-000200000004', 'Bánh nướng đậu đỏ (hộp 4 bánh)', 'Nhân đậu đỏ nấu mật mía, vỏ mỏng. Mỗi bánh 150 g, đóng hộp giấy kraft, giao toàn quốc.', 'Tiệm Bánh Cô Ba', 'Thành phố Hồ Chí Minh', false, 4, 195000, 110, '2027-01-05', 'NATIONWIDE', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000017', '00000000-0000-4000-8000-000200000004', 'Hộp bánh mini nhiều vị (12 bánh 50 g)', '12 bánh nướng nhỏ ba vị đậu xanh, đậu đỏ, trà xanh. Vừa một miếng, hợp làm quà cho trẻ nhỏ và văn phòng.', 'Tiệm Bánh Cô Ba', 'Thành phố Hồ Chí Minh', false, 12, 240000, 90, '2027-01-05', 'NATIONWIDE', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000018', '00000000-0000-4000-8000-000200000004', 'Bánh dẻo trà xanh (1 bánh 150 g)', 'Vỏ dẻo trà xanh Bảo Lộc, nhân đậu xanh. Bán lẻ từng bánh, giao trong ngày ở TP.HCM.', 'Tiệm Bánh Cô Ba', 'Thành phố Hồ Chí Minh', false, 1, 45000, 180, '2026-12-10', 'LOCAL', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000019', '00000000-0000-4000-8000-000200000006', 'Bánh lạnh phô mai trà xanh (hộp 4 bánh)', 'Bánh lạnh vỏ trong, nhân phô mai kem và matcha. Bảo quản ngăn mát, giao nội thành TP.HCM trong 2 giờ.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', false, 4, 360000, 45, '2026-11-28', 'LOCAL', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000020', '00000000-0000-4000-8000-000200000006', 'Bánh lạnh sầu riêng (hộp 6 bánh)', 'Bánh lạnh nhân sầu riêng Ri6 nguyên múi. Mỗi bánh 120 g, bảo quản ngăn mát, giao nội thành.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', false, 6, 520000, 35, '2026-11-28', 'LOCAL', NULL, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000021', '00000000-0000-4000-8000-000200000006', 'Bánh nướng trứng muối tan chảy (hộp 4 bánh)', 'Nhân sốt trứng muối chảy khi hâm nóng 10 giây. Mỗi bánh 120 g, bảo quản ngăn mát 30 ngày.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', false, 4, 420000, 70, '2026-12-30', 'NATIONWIDE', 100, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000022', '00000000-0000-4000-8000-000200000006', 'Bánh nướng chay đậu xanh (hộp 4 bánh)', 'Không dùng mỡ động vật và trứng, nhân đậu xanh hạt sen. Hợp người ăn chay, mỗi bánh 150 g.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', false, 4, 260000, 90, '2027-01-05', 'NATIONWIDE', 100, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000023', '00000000-0000-4000-8000-000200000006', 'Hộp quà doanh nghiệp Nhà Mây (6 bánh và trà)', 'Hộp sơn mài 6 bánh nướng và dẻo, kèm trà ô long 100 g và thiệp in logo theo yêu cầu. Đặt từ 50 hộp có giá riêng.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', false, 6, 1500000, 30, '2027-01-15', 'NATIONWIDE', 100, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000024', '00000000-0000-4000-8000-000200000006', 'Bánh nướng hạt sen Sen Hồng (hộp 4 bánh)', 'Hàng nhập từ cơ sở Sen Hồng ở Đồng Tháp, Nhà Mây bán lại. Nhân hạt sen tươi, mỗi bánh 160 g.', 'Sen Hồng', 'Tỉnh Đồng Tháp', true, 4, 230000, 100, '2027-01-05', 'NATIONWIDE', 100, 'ON_SALE', 0),
       ('00000000-0000-4000-8000-000300000025', '00000000-0000-4000-8000-000200000006', 'Bánh dẻo khoai môn (1 bánh 180 g)', 'Vỏ dẻo tím, nhân khoai môn Đà Lạt. Bán lẻ từng bánh, giao nội thành TP.HCM.', 'Bánh Nhà Mây', 'Thành phố Hồ Chí Minh', false, 1, 65000, 160, '2026-12-10', 'LOCAL', NULL, 'ON_SALE', 0)
ON CONFLICT DO NOTHING;

INSERT INTO product_cake_attributes (product_id, attribute_id)
VALUES ('00000000-0000-4000-8000-000300000009', 'a1f0c0de-0000-4000-8000-000000000102'),
       ('00000000-0000-4000-8000-000300000010', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000011', 'a1f0c0de-0000-4000-8000-000000000102'),
       ('00000000-0000-4000-8000-000300000012', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000013', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000013', 'a1f0c0de-0000-4000-8000-000000000102'),
       ('00000000-0000-4000-8000-000300000014', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000015', 'a1f0c0de-0000-4000-8000-000000000102'),
       ('00000000-0000-4000-8000-000300000016', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000017', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000018', 'a1f0c0de-0000-4000-8000-000000000102'),
       ('00000000-0000-4000-8000-000300000019', 'a1f0c0de-0000-4000-8000-000000000103'),
       ('00000000-0000-4000-8000-000300000020', 'a1f0c0de-0000-4000-8000-000000000103'),
       ('00000000-0000-4000-8000-000300000021', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000022', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000023', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000023', 'a1f0c0de-0000-4000-8000-000000000102'),
       ('00000000-0000-4000-8000-000300000024', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000025', 'a1f0c0de-0000-4000-8000-000000000102'),
       ('00000000-0000-4000-8000-000300000009', 'a1f0c0de-0000-4000-8000-000000000202'),
       ('00000000-0000-4000-8000-000300000010', 'a1f0c0de-0000-4000-8000-000000000201'),
       ('00000000-0000-4000-8000-000300000011', 'a1f0c0de-0000-4000-8000-000000000201'),
       ('00000000-0000-4000-8000-000300000012', 'a1f0c0de-0000-4000-8000-000000000203'),
       ('00000000-0000-4000-8000-000300000012', 'a1f0c0de-0000-4000-8000-000000000208'),
       ('00000000-0000-4000-8000-000300000013', 'a1f0c0de-0000-4000-8000-000000000201'),
       ('00000000-0000-4000-8000-000300000013', 'a1f0c0de-0000-4000-8000-000000000202'),
       ('00000000-0000-4000-8000-000300000013', 'a1f0c0de-0000-4000-8000-000000000203'),
       ('00000000-0000-4000-8000-000300000014', 'a1f0c0de-0000-4000-8000-000000000205'),
       ('00000000-0000-4000-8000-000300000015', 'a1f0c0de-0000-4000-8000-000000000207'),
       ('00000000-0000-4000-8000-000300000016', 'a1f0c0de-0000-4000-8000-000000000204'),
       ('00000000-0000-4000-8000-000300000017', 'a1f0c0de-0000-4000-8000-000000000202'),
       ('00000000-0000-4000-8000-000300000017', 'a1f0c0de-0000-4000-8000-000000000204'),
       ('00000000-0000-4000-8000-000300000017', 'a1f0c0de-0000-4000-8000-000000000206'),
       ('00000000-0000-4000-8000-000300000018', 'a1f0c0de-0000-4000-8000-000000000206'),
       ('00000000-0000-4000-8000-000300000018', 'a1f0c0de-0000-4000-8000-000000000202'),
       ('00000000-0000-4000-8000-000300000019', 'a1f0c0de-0000-4000-8000-000000000206'),
       ('00000000-0000-4000-8000-000300000020', 'a1f0c0de-0000-4000-8000-000000000207'),
       ('00000000-0000-4000-8000-000300000021', 'a1f0c0de-0000-4000-8000-000000000208'),
       ('00000000-0000-4000-8000-000300000022', 'a1f0c0de-0000-4000-8000-000000000202'),
       ('00000000-0000-4000-8000-000300000022', 'a1f0c0de-0000-4000-8000-000000000203'),
       ('00000000-0000-4000-8000-000300000023', 'a1f0c0de-0000-4000-8000-000000000201'),
       ('00000000-0000-4000-8000-000300000023', 'a1f0c0de-0000-4000-8000-000000000208'),
       ('00000000-0000-4000-8000-000300000023', 'a1f0c0de-0000-4000-8000-000000000203'),
       ('00000000-0000-4000-8000-000300000024', 'a1f0c0de-0000-4000-8000-000000000203'),
       ('00000000-0000-4000-8000-000300000025', 'a1f0c0de-0000-4000-8000-000000000205')
ON CONFLICT DO NOTHING;

INSERT INTO product_price_tiers (id, product_id, from_qty, unit_price)
SELECT md5(t.product_id || ':' || t.from_qty)::uuid::text, t.product_id, t.from_qty, t.unit_price
FROM (VALUES ('00000000-0000-4000-8000-000300000010', 10, 342000),
       ('00000000-0000-4000-8000-000300000013', 20, 845000),
       ('00000000-0000-4000-8000-000300000021', 10, 399000),
       ('00000000-0000-4000-8000-000300000023', 20, 1425000)) AS t (product_id, from_qty, unit_price)
ON CONFLICT DO NOTHING;

-- one photo per product, also for the 8 hand-written products of Trăng Vàng (files: infra/minio/seed)
INSERT INTO product_images (product_id, position, object_key)
VALUES ('00000000-0000-4000-8000-000300000001', 0, 'products/00000000-0000-4000-8000-000200000001/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000002', 0, 'products/00000000-0000-4000-8000-000200000001/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000003', 0, 'products/00000000-0000-4000-8000-000200000001/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000004', 0, 'products/00000000-0000-4000-8000-000200000001/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000005', 0, 'products/00000000-0000-4000-8000-000200000001/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000006', 0, 'products/00000000-0000-4000-8000-000200000001/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000007', 0, 'products/00000000-0000-4000-8000-000200000001/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000008', 0, 'products/00000000-0000-4000-8000-000200000001/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000009', 0, 'products/00000000-0000-4000-8000-000200000003/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000010', 0, 'products/00000000-0000-4000-8000-000200000003/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000011', 0, 'products/00000000-0000-4000-8000-000200000003/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000012', 0, 'products/00000000-0000-4000-8000-000200000003/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000013', 0, 'products/00000000-0000-4000-8000-000200000003/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000014', 0, 'products/00000000-0000-4000-8000-000200000004/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000015', 0, 'products/00000000-0000-4000-8000-000200000004/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000016', 0, 'products/00000000-0000-4000-8000-000200000004/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000017', 0, 'products/00000000-0000-4000-8000-000200000004/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000018', 0, 'products/00000000-0000-4000-8000-000200000004/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000019', 0, 'products/00000000-0000-4000-8000-000200000006/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000020', 0, 'products/00000000-0000-4000-8000-000200000006/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000021', 0, 'products/00000000-0000-4000-8000-000200000006/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000022', 0, 'products/00000000-0000-4000-8000-000200000006/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000023', 0, 'products/00000000-0000-4000-8000-000200000006/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000024', 0, 'products/00000000-0000-4000-8000-000200000006/mk-1.jpg'),
       ('00000000-0000-4000-8000-000300000025', 0, 'products/00000000-0000-4000-8000-000200000006/mk-1.jpg')
ON CONFLICT DO NOTHING;

-- what the order-taking vendors accept (Flow 2 invites them by these values)
INSERT INTO order_profiles (id, vendor_id, min_qty, lead_time_days, weekly_capacity, early_bird_offer, logo_printing, created_at, updated_at)
VALUES ('deb146f6-391b-9a90-9885-9bf5aa295745', '00000000-0000-4000-8000-000200000003', 30, 10, 800, 'Tặng thiệp in tên cho đơn đặt trước 20 ngày', true, now(), now()),
       ('1989a5e2-2c2a-f4d8-4b94-853f68b6f35c', '00000000-0000-4000-8000-000200000005', 100, 21, 5000, 'Giảm 7% cho đơn chốt trước ngày 1/8', true, now(), now()),
       ('69208341-6246-2cf9-1c27-745f6c9ce3b8', '00000000-0000-4000-8000-000200000006', 50, 14, 1500, NULL, false, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO ref_price_tiers (id, order_profile_id, from_qty, unit_price)
VALUES ('4f389f34-8029-af18-11d2-5f05d0bb5266', 'deb146f6-391b-9a90-9885-9bf5aa295745', 30, 95000),
       ('02abeb16-8149-6d20-859f-ed774f660bea', 'deb146f6-391b-9a90-9885-9bf5aa295745', 100, 85000),
       ('7bc6e8e2-8a94-592c-8b28-d7861e4b8d6c', '1989a5e2-2c2a-f4d8-4b94-853f68b6f35c', 100, 140000),
       ('4201306e-5d98-397a-2dc2-abaa6b898e1a', '1989a5e2-2c2a-f4d8-4b94-853f68b6f35c', 300, 125000),
       ('d90372eb-4f1c-3ec7-71ee-7ff022003575', '1989a5e2-2c2a-f4d8-4b94-853f68b6f35c', 1000, 110000),
       ('8db6759a-1bee-a416-2713-69b5d5c66c2f', '69208341-6246-2cf9-1c27-745f6c9ce3b8', 50, 150000),
       ('342da12c-f3d8-c9ae-5d59-e0417c1a9f9d', '69208341-6246-2cf9-1c27-745f6c9ce3b8', 200, 135000)
ON CONFLICT DO NOTHING;

INSERT INTO order_profile_custom_types (order_profile_id, custom_type)
VALUES ('deb146f6-391b-9a90-9885-9bf5aa295745', 'CARD'),
       ('deb146f6-391b-9a90-9885-9bf5aa295745', 'STICKER'),
       ('1989a5e2-2c2a-f4d8-4b94-853f68b6f35c', 'BAG'),
       ('1989a5e2-2c2a-f4d8-4b94-853f68b6f35c', 'CARD'),
       ('1989a5e2-2c2a-f4d8-4b94-853f68b6f35c', 'STICKER'),
       ('1989a5e2-2c2a-f4d8-4b94-853f68b6f35c', 'TEMPLATE_BOX'),
       ('69208341-6246-2cf9-1c27-745f6c9ce3b8', 'BAG'),
       ('69208341-6246-2cf9-1c27-745f6c9ce3b8', 'CARD')
ON CONFLICT DO NOTHING;
-- <<< DEMO DATA
