-- vendor_db: an approved Shop for the demo seller of 01_demo_seller_identity.sql. Local dev / demo only.
-- How to run: api/docs/seed/README.md. Needs vendor-service started once (Hibernate created the tables).
-- Variables (psql -v):
--   owner_account_id  required: accounts.id of the demo seller in identity_db (printed by step 1)
-- Safe to run again: an account that already has a vendor is left as it is.

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

\if :{?owner_account_id}
\else
  \echo 'Missing owner: run with  -v owner_account_id=...  (the id printed by step 1)'
  \quit
\endif

INSERT INTO vendors (id, owner_account_id, legal_name, entity_type, tax_code, address, area_code,
                     bank_name, account_number, account_holder,
                     supply_source, sells_shop, accepts_orders, status, created_at, updated_at)
VALUES (gen_random_uuid()::text, :'owner_account_id',
        'Công ty TNHH Bánh Trung Thu Trăng Vàng', 'ENTERPRISE', '0312345678',
        '123 Nguyễn Trãi, Phường 2, Quận 5, TP. Hồ Chí Minh', 'HCM',
        'Vietcombank', '0071000123456', 'CONG TY TNHH BANH TRUNG THU TRANG VANG',
        'BOTH', true, true, 'APPROVED', now(), now())
ON CONFLICT (owner_account_id) DO NOTHING;

SELECT id AS vendor_id, status FROM vendors WHERE owner_account_id = :'owner_account_id';
