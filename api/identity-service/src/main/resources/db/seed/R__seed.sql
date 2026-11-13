-- Dev seed of identity_db (docs/guides/database.md). Runs only where SPRING_FLYWAY_LOCATIONS adds classpath:db/seed, i.e.
-- docker-compose; never in tests or production. Flyway runs it again whenever this file changes, so every insert
-- skips rows that already exist: accounts people made by hand are never touched.
-- IDs come from the registry in docs/guides/database.md; ${seed_password} is SEED_PASSWORD from .env.
-- NFC results (legal_profiles) are not here: they need the PII key, see db/seed/nfc-profiles.json.

DO $$
BEGIN
    IF '${seed_password}' = '' THEN
        RAISE EXCEPTION 'SEED_PASSWORD is empty: set it in the repo-root .env (see .env.example)';
    END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- phone numbers (accounts and addresses) are stored as the 9 subscriber digits (PhoneNumber.value).
-- The admin is seeded here like every persona, with the same SEED_PASSWORD; no environment creates one at startup.
INSERT INTO accounts (id, email, phone_number, password_hash, role, account_verified, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000100000000', 'admin@mk.com', NULL,
        crypt('${seed_password}', gen_salt('bf', 10)), 'ADMIN', true, now(), now()),
       ('00000000-0000-4000-8000-000100000001', 'member1@mk.com', '901000001',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000002', 'member2@mk.com', '901000002',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000003', 'member3@mk.com', '901000003',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', false, now(), now()),
       ('00000000-0000-4000-8000-000100000004', 'member4@mk.com', '901000004',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000005', 'member5@mk.com', '901000005',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now())
ON CONFLICT DO NOTHING;

-- joined with accounts: when an email was already taken by a hand-made account, its seed rows are skipped too
INSERT INTO user_profiles (account_id, full_name, created_at, updated_at)
SELECT a.id, p.full_name, now(), now()
FROM (VALUES ('00000000-0000-4000-8000-000100000000', 'Quản trị viên MoonKage'),
             ('00000000-0000-4000-8000-000100000001', 'Nguyễn Thị Lan'),
             ('00000000-0000-4000-8000-000100000002', 'Trần Văn Minh'),
             ('00000000-0000-4000-8000-000100000003', 'Lê Thị Hoa'),
             ('00000000-0000-4000-8000-000100000004', 'Phạm Văn Bánh'),
             ('00000000-0000-4000-8000-000100000005', 'Võ Thị Quê')) AS p (account_id, full_name)
JOIN accounts a ON a.id = p.account_id
ON CONFLICT DO NOTHING;

-- two administrative levels; the province is coded (delivery areas, Q-12), the ward is display text (L-15)
INSERT INTO addresses (id, account_id, recipient_name, recipient_phone, province_code, province_name, ward_name,
                       detail, label, is_default, created_at, updated_at)
SELECT d.id, a.id, d.recipient_name, d.recipient_phone, d.province_code, d.province_name, d.ward_name,
       d.detail, d.label, d.is_default, now(), now()
FROM (VALUES ('00000000-0000-4000-8000-000600000001', '00000000-0000-4000-8000-000100000001',
              'Nguyễn Thị Lan', '901000001', '79', 'Thành phố Hồ Chí Minh', 'Phường Sài Gòn',
              '12 Lê Lợi', 'Nhà riêng', true),
             ('00000000-0000-4000-8000-000600000002', '00000000-0000-4000-8000-000100000001',
              'Nguyễn Văn Hùng', '901000011', '01', 'Thành phố Hà Nội', 'Phường Ba Đình',
              '25 Điện Biên Phủ', 'Văn phòng', false),
             ('00000000-0000-4000-8000-000600000003', '00000000-0000-4000-8000-000100000002',
              'Trần Văn Minh', '901000002', '01', 'Thành phố Hà Nội', 'Phường Ba Đình',
              '8 Hoàng Diệu', NULL, true))
         AS d (id, account_id, recipient_name, recipient_phone, province_code, province_name, ward_name, detail,
               label, is_default)
JOIN accounts a ON a.id = d.account_id
ON CONFLICT DO NOTHING;

-- member15-member17: email confirmed and NFC done (nfc-profiles.json) but no shop yet, to walk the seller sign-up
INSERT INTO accounts (id, email, phone_number, password_hash, role, account_verified, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000100000015', 'member15@mk.com', '901000015',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000016', 'member16@mk.com', '901000016',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000017', 'member17@mk.com', '901000017',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO user_profiles (account_id, full_name, created_at, updated_at)
SELECT a.id, p.full_name, now(), now()
FROM (VALUES ('00000000-0000-4000-8000-000100000015', 'Châu Ngọc Hà'),
             ('00000000-0000-4000-8000-000100000016', 'Tạ Văn Khoa'),
             ('00000000-0000-4000-8000-000100000017', 'Lâm Bảo Ngọc')) AS p (account_id, full_name)
JOIN accounts a ON a.id = p.account_id
ON CONFLICT DO NOTHING;

-- >>> DEMO DATA: generated by infra/dev/demo_seed.py; edit the script, not these lines
-- vendor owners member6-member9 and buyers member10-member14 (NFC of the owners: nfc-profiles.json)
INSERT INTO accounts (id, email, phone_number, password_hash, role, account_verified, created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000100000006', 'member6@mk.com', '901000006', crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000007', 'member7@mk.com', '901000007', crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000008', 'member8@mk.com', '901000008', crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000009', 'member9@mk.com', '901000009', crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000010', 'member10@mk.com', '901000010', crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000011', 'member11@mk.com', '901000011', crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000012', 'member12@mk.com', '901000012', crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000013', 'member13@mk.com', '901000013', crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now()),
       ('00000000-0000-4000-8000-000100000014', 'member14@mk.com', '901000014', crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO user_profiles (account_id, full_name, created_at, updated_at)
SELECT a.id, p.full_name, now(), now()
FROM (VALUES ('00000000-0000-4000-8000-000100000006', 'Đỗ Minh Tâm'),
       ('00000000-0000-4000-8000-000100000007', 'Hoàng Thị Ba'),
       ('00000000-0000-4000-8000-000100000008', 'Bùi Quang Huy'),
       ('00000000-0000-4000-8000-000100000009', 'Ngô Thanh Mây'),
       ('00000000-0000-4000-8000-000100000010', 'Đặng Thu Trang'),
       ('00000000-0000-4000-8000-000100000011', 'Phan Quốc Bảo'),
       ('00000000-0000-4000-8000-000100000012', 'Trịnh Mỹ Linh'),
       ('00000000-0000-4000-8000-000100000013', 'Lý Gia Hân'),
       ('00000000-0000-4000-8000-000100000014', 'Mai Đức Thắng')) AS p (account_id, full_name)
JOIN accounts a ON a.id = p.account_id
ON CONFLICT DO NOTHING;

INSERT INTO addresses (id, account_id, recipient_name, recipient_phone, province_code, province_name, ward_name, detail, label, is_default, created_at, updated_at)
SELECT d.id, a.id, d.recipient_name, d.recipient_phone, d.province_code, d.province_name, d.ward_name, d.detail, d.label, d.is_default, now(), now()
FROM (VALUES ('00000000-0000-4000-8000-000600000004', '00000000-0000-4000-8000-000100000010', 'Đặng Thu Trang', '901000010', '79', 'Thành phố Hồ Chí Minh', 'Phường Bến Thành', '88 Nguyễn Du', 'Nhà riêng', true),
       ('00000000-0000-4000-8000-000600000005', '00000000-0000-4000-8000-000100000011', 'Phan Quốc Bảo', '901000011', '79', 'Thành phố Hồ Chí Minh', 'Phường Thủ Đức', '14 Võ Văn Ngân', 'Nhà riêng', true),
       ('00000000-0000-4000-8000-000600000006', '00000000-0000-4000-8000-000100000012', 'Trịnh Mỹ Linh', '901000012', '79', 'Thành phố Hồ Chí Minh', 'Phường Gia Định', '210 Phan Đăng Lưu', 'Nhà riêng', true),
       ('00000000-0000-4000-8000-000600000007', '00000000-0000-4000-8000-000100000013', 'Lý Gia Hân', '901000013', '79', 'Thành phố Hồ Chí Minh', 'Phường Tân Định', '5 Trần Quang Khải', 'Công ty', true),
       ('00000000-0000-4000-8000-000600000008', '00000000-0000-4000-8000-000100000014', 'Mai Đức Thắng', '901000014', '92', 'Thành phố Cần Thơ', 'Phường Ninh Kiều', '36 Hai Bà Trưng', 'Nhà riêng', true))
     AS d (id, account_id, recipient_name, recipient_phone, province_code, province_name, ward_name, detail, label, is_default)
JOIN accounts a ON a.id = d.account_id
ON CONFLICT DO NOTHING;
-- <<< DEMO DATA
