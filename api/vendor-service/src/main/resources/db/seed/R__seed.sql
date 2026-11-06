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

-- ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
-- Product 000300000001 (sản phẩm mẫu của Shop Trăng Vàng)
--
-- Products are written by vendor-service only (L-18) and reach catalog-service through the
-- product.upserted event, so a seed row alone would never show up in the catalogue. The seed
-- therefore writes the product AND the matching outbox event: the relay publishes it like any
-- other change, and catalog-service projects it into product_views (its read model).
--
-- The image key points at the file infra/minio/init.sh puts in the public bucket, so the seed
-- works from a clean `docker compose down -v` without a manual upload.
-- ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
INSERT INTO products (id, vendor_id, name, description, brand, origin, resold, pieces_per_box,
                       list_price, stock, expiry_date, delivery_label, quote_threshold, status, version)
VALUES ('00000000-0000-4000-8000-000300000001', '00000000-0000-4000-8000-000200000001',
        'Bánh Trung Thu Trăng Vàng - Hộp 6 Bánh',
        'Hộp bánh trung thu thập cẩm 6 chiếc, vỏ bánh nướng truyền thống nhân thập cẩm gồm đậu xanh, hạt sen, trứng muối và lạp xưởng. Làm thủ công mỗi ngày, hộp quà biếu tặng gia đình và đối tác.',
        'Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng', NULL, false, 6,
        120000, 500, '2026-12-31', 'NATIONWIDE', 50, 'ON_SALE', 0)
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, position, object_key)
VALUES ('00000000-0000-4000-8000-000300000001', 0,
        'products/00000000-0000-4000-8000-000200000001/banh-trung-thu-hop-6.jpg')
ON CONFLICT DO NOTHING;

INSERT INTO product_cake_attributes (product_id, attribute_id)
VALUES ('00000000-0000-4000-8000-000300000001', 'a1f0c0de-0000-4000-8000-000000000101'),
       ('00000000-0000-4000-8000-000300000001', 'a1f0c0de-0000-4000-8000-000000000201')
ON CONFLICT DO NOTHING;

INSERT INTO product_price_tiers (id, product_id, from_qty, unit_price)
VALUES ('00000000-0000-4000-8000-000300000101', '00000000-0000-4000-8000-000300000001', 50, 110000)
ON CONFLICT DO NOTHING;

-- The event the relay sends to the other services. Its id is fixed, so a re-run of the seed does
-- not publish the same product twice (catalog-service skips an event id it has already applied).
INSERT INTO outbox_events (id, created_at, updated_at, attempts, payload, published_at, routing_key)
VALUES ('00000000-0000-4000-8000-000900000001', now(), now(), 0,
        '{"eventId":"00000000-0000-4000-8000-000900000001","schemaVersion":1,"eventType":"product.upserted","sourceService":"vendor-service","aggregateType":"PRODUCT","aggregateId":"00000000-0000-4000-8000-000300000001","sourceVersion":0,"occurredAt":"2026-11-05T00:00:00Z","data":{"productId":"00000000-0000-4000-8000-000300000001","vendorId":"00000000-0000-4000-8000-000200000001","name":"Bánh Trung Thu Trăng Vàng - Hộp 6 Bánh","description":"Hộp bánh trung thu thập cẩm 6 chiếc, vỏ bánh nướng truyền thống nhân thập cẩm gồm đậu xanh, hạt sen, trứng muối và lạp xưởng. Làm thủ công mỗi ngày, hộp quà biếu tặng gia đình và đối tác.","crustCodes":["banh-nuong"],"fillingCodes":["thap-cam"],"brand":"Doanh nghiệp tư nhân Bánh Trung Thu Trăng Vàng","origin":null,"resold":false,"piecesPerBox":6,"listPrice":120000,"stock":500,"expiryDate":"2026-12-31","deliveryLabel":"NATIONWIDE","quoteThreshold":50,"status":"ON_SALE","imageKeys":["products/00000000-0000-4000-8000-000200000001/banh-trung-thu-hop-6.jpg"],"priceTiers":[{"fromQty":50,"unitPrice":110000}]}}',
        NULL, 'product.upserted')
ON CONFLICT DO NOTHING;
