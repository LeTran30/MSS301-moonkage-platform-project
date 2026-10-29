-- Dev seed of identity_db (docs/guides/database.md). Runs only where SPRING_FLYWAY_LOCATIONS adds classpath:db/seed, i.e.
-- docker-compose; never in tests or production. Flyway runs it again whenever this file changes, so every insert
-- skips rows that already exist: accounts people made by hand are never touched.
-- IDs come from the registry in docs/guides/database.md; ${seed_password} is SEED_PASSWORD from .env,
-- ${id_hash_pepper} is ID_HASH_PEPPER_V1.

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
INSERT INTO profiles (account_id, full_name, created_at, updated_at)
SELECT a.id, p.full_name, now(), now()
FROM (VALUES ('00000000-0000-4000-8000-000100000000', 'Quản trị viên MoonKage'),
             ('00000000-0000-4000-8000-000100000001', 'Nguyễn Thị Lan'),
             ('00000000-0000-4000-8000-000100000002', 'Trần Văn Minh'),
             ('00000000-0000-4000-8000-000100000003', 'Lê Thị Hoa'),
             ('00000000-0000-4000-8000-000100000004', 'Phạm Văn Bánh'),
             ('00000000-0000-4000-8000-000100000005', 'Võ Thị Quê')) AS p (account_id, full_name)
JOIN accounts a ON a.id = p.account_id
ON CONFLICT DO NOTHING;

-- KYC results (FR-04) of three members. The hash is the one HmacIdNumberHasher makes (HMAC-SHA256 with the pepper,
-- key version 1): change both together. Without a pepper on this machine the rows stay unverified, since the service
-- could not check those cards either. A profile already verified, or a number already taken, is left alone.
UPDATE profiles p
SET kyc_verified     = true,
    legal_name       = k.legal_name,
    id_number_hash   = k.id_number_hash,
    id_hash_key_ver  = 1,
    id_number_masked = repeat('*', 8) || right(k.id_number, 4),
    updated_at       = now()
FROM (SELECT s.account_id, s.legal_name, s.id_number,
             encode(hmac(s.id_number, '${id_hash_pepper}', 'sha256'), 'hex') AS id_number_hash
      FROM (VALUES ('00000000-0000-4000-8000-000100000001', 'NGUYEN THI LAN', '079190000001'),
                   ('00000000-0000-4000-8000-000100000004', 'PHAM VAN BANH', '079085000004'),
                   ('00000000-0000-4000-8000-000100000005', 'VO THI QUE', '001192000005'))
               AS s (account_id, legal_name, id_number)) AS k
WHERE p.account_id = k.account_id
  AND '${id_hash_pepper}' <> ''
  AND NOT p.kyc_verified
  AND NOT EXISTS (SELECT 1 FROM profiles q WHERE q.id_number_hash = k.id_number_hash);

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