#!/bin/sh
# Provisions MinIO with the root account, once per `docker compose up` (service minio-init).
# Services never get the root account: each one has its own user that can only touch its own key prefixes
# (Software Design section 8). Every step is idempotent, so running it again only re-applies the same settings.
#
# Key layout (the services' application.yml must match the prefixes below):
#   MINIO_PUBLIC_BUCKET       products/        catalog: product images, anonymously readable
#   MINIO_PRIVATE_BUCKET      order/           order: mockups, dispute evidence, invoices
#   MINIO_VENDOR_DOCS_BUCKET  vendor/          vendor: legal documents, agreements, fee invoices
#   private buckets           tmp/<service>/   unconfirmed uploads, removed after MINIO_TEMP_RETENTION_DAYS
set -eu

ALIAS=local
TEMP_PREFIX=tmp

mc alias set "$ALIAS" "$MINIO_INTERNAL_URL" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null

# ── buckets ──
for bucket in "$MINIO_PUBLIC_BUCKET" "$MINIO_PRIVATE_BUCKET" "$MINIO_VENDOR_DOCS_BUCKET"; do
    mc mb --ignore-existing "$ALIAS/$bucket"
done
mc anonymous set download "$ALIAS/$MINIO_PUBLIC_BUCKET"

for bucket in "$MINIO_PRIVATE_BUCKET" "$MINIO_VENDOR_DOCS_BUCKET"; do
    mc anonymous set none "$ALIAS/$bucket"
    # import replaces the whole lifecycle configuration, so re-running never duplicates the rule
    mc ilm import "$ALIAS/$bucket" <<EOF
{"Rules":[{"ID":"expire-unconfirmed-uploads","Status":"Enabled","Filter":{"Prefix":"$TEMP_PREFIX/"},
"Expiration":{"Days":$MINIO_TEMP_RETENTION_DAYS}}]}
EOF
done

# ── one user per service ──
# $1 service, $2 access key, $3 secret key, $4… "bucket/prefix" pairs the service may read, write and delete
create_service_user() {
    service=$1 access_key=$2 secret_key=$3
    shift 3
    resources=""
    for path in "$@"; do
        resources="$resources${resources:+,}\"arn:aws:s3:::$path/*\""
    done
    policy_file="/tmp/$service-policy.json"
    cat >"$policy_file" <<EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow",
"Action":["s3:GetObject","s3:PutObject","s3:DeleteObject"],"Resource":[$resources]}]}
EOF
    mc admin policy create "$ALIAS" "$service-files" "$policy_file"
    mc admin user add "$ALIAS" "$access_key" "$secret_key"
    # attach fails when already attached; that is the state we want
    mc admin policy attach "$ALIAS" "$service-files" --user "$access_key" 2>/dev/null \
        || mc admin user info "$ALIAS" "$access_key" | grep -q "$service-files"
    echo "MinIO user for $service ready: $*"
}

create_service_user catalog "$MINIO_CATALOG_ACCESS_KEY" "$MINIO_CATALOG_SECRET_KEY" \
    "$MINIO_PUBLIC_BUCKET/products" \
    "$MINIO_PRIVATE_BUCKET/$TEMP_PREFIX/catalog"
create_service_user order "$MINIO_ORDER_ACCESS_KEY" "$MINIO_ORDER_SECRET_KEY" \
    "$MINIO_PRIVATE_BUCKET/order" \
    "$MINIO_PRIVATE_BUCKET/$TEMP_PREFIX/order"
create_service_user vendor "$MINIO_VENDOR_ACCESS_KEY" "$MINIO_VENDOR_SECRET_KEY" \
    "$MINIO_VENDOR_DOCS_BUCKET/vendor" \
    "$MINIO_VENDOR_DOCS_BUCKET/$TEMP_PREFIX/vendor"