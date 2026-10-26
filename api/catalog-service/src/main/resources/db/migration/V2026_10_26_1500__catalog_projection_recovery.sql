-- C2 technical recovery state only. V2 and legacy product tables are not changed/re-created.
CREATE TABLE product_tombstones (
    product_id varchar(36) PRIMARY KEY,
    source_version bigint NOT NULL CHECK (source_version >= 0),
    removed_at timestamptz NOT NULL DEFAULT now()
);

-- Preserve removals projected before this migration; never reinterpret them as restorable products.
INSERT INTO product_tombstones(product_id, source_version, removed_at)
SELECT product_id, source_version, updated_at FROM product_views WHERE status='REMOVED';

-- Received != processed. Pending raw events wait for approved producer adapters, and remain replay sources.
CREATE TABLE projection_inbox (
    event_id varchar(64) PRIMARY KEY,
    routing_key varchar(100) NOT NULL,
    payload jsonb NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_projection_inbox_received ON projection_inbox (received_at, event_id);
