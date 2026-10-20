-- Baseline: the payment-service schema as Hibernate built it from the entities on 2026-10-20 (pg_dump --schema-only).
-- Never edit this file: add a new V<yyyy_MM_dd_HHmm>__<what>.sql instead (docs/guides/database.md).

CREATE TABLE public.disbursement_requests (
    id character varying(255) NOT NULL,
    amount bigint NOT NULL,
    approved_amount bigint,
    created_at timestamp(6) without time zone,
    decided_at timestamp(6) without time zone,
    order_id character varying(255) NOT NULL,
    purpose character varying(255) NOT NULL,
    reason text,
    status character varying(255) NOT NULL,
    CONSTRAINT disbursement_requests_purpose_check CHECK (((purpose)::text = ANY ((ARRAY['MATERIALS'::character varying, 'PRINTING'::character varying, 'PACKAGING'::character varying, 'RESTOCK'::character varying])::text[]))),
    CONSTRAINT disbursement_requests_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);

CREATE TABLE public.ledgers (
    id character varying(255) NOT NULL,
    disbursed bigint NOT NULL,
    expected_payout_date date,
    held bigint NOT NULL,
    order_id character varying(255) NOT NULL,
    paid_out bigint NOT NULL,
    refunded bigint NOT NULL,
    updated_at timestamp(6) without time zone,
    version bigint
);

CREATE TABLE public.payments (
    id character varying(255) NOT NULL,
    amount bigint NOT NULL,
    created_at timestamp(6) without time zone,
    method character varying(255),
    order_id character varying(255) NOT NULL,
    paid_at timestamp(6) without time zone,
    status character varying(255) NOT NULL,
    transaction_ref character varying(255),
    type character varying(255) NOT NULL,
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SUCCEEDED'::character varying, 'FAILED'::character varying])::text[]))),
    CONSTRAINT payments_type_check CHECK (((type)::text = ANY ((ARRAY['BUY_NOW'::character varying, 'DEPOSIT'::character varying, 'REMAINING'::character varying, 'REFUND'::character varying])::text[])))
);

ALTER TABLE ONLY public.disbursement_requests
    ADD CONSTRAINT disbursement_requests_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ledgers
    ADD CONSTRAINT ledgers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ledgers
    ADD CONSTRAINT uk12xlk60ch84r6rrocyhofv145 UNIQUE (order_id);
