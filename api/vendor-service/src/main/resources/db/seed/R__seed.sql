-- Dev seed of vendor_db (docs/guides/database.md). Runs only where SPRING_FLYWAY_LOCATIONS adds classpath:db/seed, i.e.
-- docker-compose. Flyway runs it again whenever this file changes, so every insert skips rows that already exist.
-- Owners are the seed accounts of identity-service; IDs come from the registry in docs/guides/database.md.

INSERT INTO vendors (id, owner_account_id, legal_name, entity_type, tax_code, address, area_code,
                     bank_name, account_number, account_holder,
                     supply_source, sells_shop, accepts_orders, status, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000200000001', '00000000-0000-4000-8000-000100000004',
        'Công ty TNHH Bánh Trung Thu Trăng Vàng', 'ENTERPRISE', '0312345678',
        '123 Nguyễn Trãi, Thành phố Hồ Chí Minh', '79',
        'Vietcombank', '0071000123456', 'CONG TY TNHH BANH TRUNG THU TRANG VANG',
        'BOTH', true, true, 'APPROVED', now(), now()),
       ('00000000-0000-4000-8000-000200000002', '00000000-0000-4000-8000-000100000005',
        'Hộ kinh doanh Bánh Quê', 'HOUSEHOLD_BUSINESS', '8012345678',
        '45 Trần Phú, Thành phố Hà Nội', '01',
        'Agribank', '1500205123456', 'VO THI QUE',
        'SELF_PRODUCED', true, false, 'PENDING', now(), now())
ON CONFLICT DO NOTHING;

-- delivery area = province code (Q-12)
INSERT INTO vendor_delivery_areas (id, vendor_id, area_code)
VALUES ('00000000-0000-4000-8000-000700000001', '00000000-0000-4000-8000-000200000001', '79'),
       ('00000000-0000-4000-8000-000700000002', '00000000-0000-4000-8000-000200000002', '01')
ON CONFLICT DO NOTHING;