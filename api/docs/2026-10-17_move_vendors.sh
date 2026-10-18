#!/usr/bin/env bash
# Moves the vendors table from identity_db to vendor_db, keeping every id, so vendorId references
# in catalog/order/quotation stay valid. Only for databases created before vendor-service existed.
#
# Run from the repo root (Git Bash on Windows), ONCE, BEFORE the new vendor-service starts for the
# first time (otherwise DemoVendorSeeder creates a second demo Shop with a new id):
#   docker compose stop identity-service vendor-service
#   bash api/docs/2026-10-17_move_vendors.sh
#   docker compose up -d --build
# Run 2026-10-17_user_profiles.sql (api/docs) first if your identity_db still has a users table.
set -euo pipefail

set -a
# shellcheck disable=SC1091
. ./.env
set +a

identity() { docker exec -i moonkage-identity-db psql -v ON_ERROR_STOP=1 -U "$DB_USERNAME" -d identity_db "$@"; }
vendor() { docker exec -i moonkage-vendor-db psql -v ON_ERROR_STOP=1 -U "$DB_USERNAME" -d vendor_db "$@"; }

docker compose up -d --wait identity-db vendor-db

if [ "$(identity -tAc "select to_regclass('public.vendors') is not null")" != "t" ]; then
    echo "identity_db has no vendors table: nothing to move."
    exit 0
fi
if [ "$(vendor -tAc "select to_regclass('public.vendors') is not null")" = "t" ]; then
    echo "vendor_db already has a vendors table: stop, check it by hand before moving anything." >&2
    exit 1
fi

# vendor_db has no accounts table, so the FK cannot follow; vendor_documents is an unused leftover (empty)
identity <<'SQL'
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS fk_vendors_owner_account;
DROP TABLE IF EXISTS vendor_documents;
SQL

docker exec moonkage-identity-db pg_dump -U "$DB_USERNAME" --no-owner --no-privileges -t public.vendors identity_db \
    | vendor

before=$(identity -tAc "select count(*) from vendors")
after=$(vendor -tAc "select count(*) from vendors")
if [ "$before" != "$after" ]; then
    echo "Row count differs (identity_db=$before, vendor_db=$after): vendors left in identity_db." >&2
    exit 1
fi

identity -c "DROP TABLE vendors;"
echo "Moved $after vendor(s) to vendor_db."
