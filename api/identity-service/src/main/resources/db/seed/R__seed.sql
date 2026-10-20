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

-- phone numbers are stored as the 9 subscriber digits (Account.toStoredPhoneNumber)
INSERT INTO accounts (id, email, phone_number, password_hash, role, account_verified, nfc_failed_attempts,
                      created_at, updated_at)
VALUES ('00000000-0000-4000-8000-000100000001', 'member1@mk.com', '901000001',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, 0, now(), now()),
       ('00000000-0000-4000-8000-000100000002', 'member2@mk.com', '901000002',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, 0, now(), now()),
       ('00000000-0000-4000-8000-000100000003', 'member3@mk.com', '901000003',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', false, 0, now(), now()),
       ('00000000-0000-4000-8000-000100000004', 'member4@mk.com', '901000004',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, 0, now(), now()),
       ('00000000-0000-4000-8000-000100000005', 'member5@mk.com', '901000005',
        crypt('${seed_password}', gen_salt('bf', 10)), 'MEMBER', true, 0, now(), now())
ON CONFLICT DO NOTHING;

-- joined with accounts: when an email was already taken by a hand-made account, its seed rows are skipped too
INSERT INTO user_profiles (account_id, full_name, created_at, updated_at)
SELECT a.id, p.full_name, now(), now()
FROM (VALUES ('00000000-0000-4000-8000-000100000001', 'Nguyễn Thị Lan'),
             ('00000000-0000-4000-8000-000100000002', 'Trần Văn Minh'),
             ('00000000-0000-4000-8000-000100000003', 'Lê Thị Hoa'),
             ('00000000-0000-4000-8000-000100000004', 'Phạm Văn Bánh'),
             ('00000000-0000-4000-8000-000100000005', 'Võ Thị Quê')) AS p (account_id, full_name)
JOIN accounts a ON a.id = p.account_id
ON CONFLICT DO NOTHING;

-- two administrative levels (province, ward), national codes
INSERT INTO addresses (id, account_id, recipient_name, recipient_phone, province_code, province_name, ward_code,
                       ward_name, detail, label, is_default, created_at, updated_at)
SELECT d.id, a.id, d.recipient_name, d.recipient_phone, d.province_code, d.province_name, d.ward_code, d.ward_name,
       d.detail, d.label, d.is_default, now(), now()
FROM (VALUES ('00000000-0000-4000-8000-000600000001', '00000000-0000-4000-8000-000100000001',
              'Nguyễn Thị Lan', '0901000001', '79', 'Thành phố Hồ Chí Minh', '26734', 'Phường Sài Gòn',
              '12 Lê Lợi', 'Nhà riêng', true),
             ('00000000-0000-4000-8000-000600000002', '00000000-0000-4000-8000-000100000001',
              'Nguyễn Văn Hùng', '0901000011', '01', 'Thành phố Hà Nội', '00004', 'Phường Ba Đình',
              '25 Điện Biên Phủ', 'Văn phòng', false),
             ('00000000-0000-4000-8000-000600000003', '00000000-0000-4000-8000-000100000002',
              'Trần Văn Minh', '0901000002', '01', 'Thành phố Hà Nội', '00004', 'Phường Ba Đình',
              '8 Hoàng Diệu', NULL, true))
         AS d (id, account_id, recipient_name, recipient_phone, province_code, province_name, ward_code, ward_name,
               detail, label, is_default)
JOIN accounts a ON a.id = d.account_id
ON CONFLICT DO NOTHING;