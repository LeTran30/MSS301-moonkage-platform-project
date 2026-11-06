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
