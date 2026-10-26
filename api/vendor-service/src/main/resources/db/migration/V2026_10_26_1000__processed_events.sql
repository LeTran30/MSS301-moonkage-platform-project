-- events from other services already handled (payment.succeeded, ...); same shape as catalog-service (NFR-05)
CREATE TABLE processed_events (
    event_id     varchar(64)  NOT NULL,
    routing_key  varchar(100) NOT NULL,
    processed_at timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT processed_events_pkey PRIMARY KEY (event_id)
);
