-- vendor_db: a Shop rejected a paid buy-now order (Q-01), so the pieces of that order go back on sale.
-- One row per order: order-service may call again (a retry) and the stock must come back only once.
-- The reservation lines stay COMMITTED: the checkout was paid, only one Shop's part of it was refused.
CREATE TABLE stock_returns (
    order_id    varchar(36) NOT NULL,
    checkout_id varchar(36) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT stock_returns_pkey PRIMARY KEY (order_id)
);
