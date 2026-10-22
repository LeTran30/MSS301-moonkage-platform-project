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
