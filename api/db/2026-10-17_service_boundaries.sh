#!/usr/bin/env bash
# Drops what Hibernate (ddl-auto: update) left behind after the service-boundary cleanup of 2026-10-17:
#   catalog_db   : order profiles, delivery areas -> vendor; reviews -> order; audit_logs -> notification
#   order_db     : payments, ledgers, disbursement_requests -> payment; commission_* removed (BR-10);
#                  orders.commission_rate removed (NOT NULL, would block every new order); audit_logs -> notification
#   quotation_db : seasons removed (no season cut-off, BR-14); audit_logs -> notification
# The new tables are created by Hibernate in vendor_db / order_db / payment_db / notification_db.
# Refuses to drop a table that still has rows. Run from the repo root (Git Bash on Windows):
#   bash api/db/2026-10-17_service_boundaries.sh
set -euo pipefail

set -a
# shellcheck disable=SC1091
. ./.env
set +a

psql_in() { docker exec -i "moonkage-$1-db" psql -v ON_ERROR_STOP=1 -U "$DB_USERNAME" -d "$1_db" "${@:2}"; }

drop_if_empty() {
    local db=$1
    shift
    for table in "$@"; do
        if [ "$(psql_in "$db" -tAc "select to_regclass('public.$table') is not null")" != "t" ]; then
            continue
        fi
        rows=$(psql_in "$db" -tAc "select count(*) from $table")
        if [ "$rows" != "0" ]; then
            echo "${db}_db.$table has $rows row(s): not dropped, move them by hand first." >&2
            exit 1
        fi
        psql_in "$db" -qc "DROP TABLE $table CASCADE"
        echo "dropped ${db}_db.$table"
    done
}

docker compose up -d --wait catalog-db order-db quotation-db

drop_if_empty catalog ref_price_tiers order_profile_custom_types order_profiles vendor_delivery_areas reviews audit_logs
drop_if_empty order ledgers payments disbursement_requests commission_invoices commission_configs audit_logs
drop_if_empty quotation seasons audit_logs

if [ "$(psql_in order -tAc "select count(*) from information_schema.columns
        where table_name = 'orders' and column_name = 'commission_rate'")" = "1" ]; then
    psql_in order -qc "ALTER TABLE orders DROP COLUMN commission_rate"
    echo "dropped order_db.orders.commission_rate"
fi
