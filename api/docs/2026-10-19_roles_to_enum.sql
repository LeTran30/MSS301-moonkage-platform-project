-- identity_db: two roles MEMBER / ADMIN kept on accounts.role, no roles table (Software Design D-19).
-- Owning a vendor is not a role: CUSTOMER and SELLER accounts both become MEMBER.
-- Only for databases created before this change; a fresh database is built by Hibernate (ddl-auto: update).
-- Run ONCE with identity-service STOPPED, before starting the new version:
--   docker compose stop identity-service
--   docker exec -i moonkage-identity-db psql -U <DB_USERNAME> -d identity_db < api/docs/2026-10-19_roles_to_enum.sql
--   docker compose up -d --build identity-service

BEGIN;

ALTER TABLE accounts ADD COLUMN role varchar(20);
UPDATE accounts a
SET role = CASE WHEN r.role_name = 'ADMIN' THEN 'ADMIN' ELSE 'MEMBER' END
FROM roles r
WHERE r.id = a.role_id;
ALTER TABLE accounts ALTER COLUMN role SET NOT NULL;
ALTER TABLE accounts ADD CONSTRAINT ck_accounts_role CHECK (role IN ('MEMBER', 'ADMIN'));

ALTER TABLE accounts DROP COLUMN role_id; -- drops its FK to roles
DROP TABLE roles;

COMMIT;
