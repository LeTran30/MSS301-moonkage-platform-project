-- Baseline: the quotation-service schema as Hibernate built it from the entities on 2026-10-20 (pg_dump --schema-only).
-- Never edit this file: add a new V<yyyy_MM_dd_HHmm>__<what>.sql instead (docs/guides/database.md).

CREATE TABLE public.quotes (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    custom_surcharge bigint,
    delivery_date date NOT NULL,
    delivery_method character varying(255) NOT NULL,
    deposit_rate numeric(5,2) NOT NULL,
    notes text,
    quantity integer NOT NULL,
    status character varying(255) NOT NULL,
    total_amount bigint NOT NULL,
    unit_price bigint NOT NULL,
    valid_until timestamp(6) without time zone NOT NULL,
    vendor_id character varying(255) NOT NULL,
    withdrawn_at timestamp(6) without time zone,
    tender_request_id character varying(255) NOT NULL,
    CONSTRAINT quotes_status_check CHECK (((status)::text = ANY ((ARRAY['SUBMITTED'::character varying, 'WITHDRAWN'::character varying, 'EXPIRED'::character varying, 'ACCEPTED'::character varying, 'CLOSED'::character varying, 'REJECTED'::character varying])::text[])))
);

CREATE TABLE public.tender_invitations (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    decline_reason text,
    responded_at timestamp(6) without time zone,
    status character varying(255) NOT NULL,
    vendor_id character varying(255) NOT NULL,
    tender_request_id character varying(255) NOT NULL,
    CONSTRAINT tender_invitations_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'QUOTED'::character varying, 'DECLINED'::character varying])::text[])))
);

CREATE TABLE public.tender_request_custom_types (
    tender_request_id character varying(255) NOT NULL,
    custom_type character varying(255) NOT NULL,
    CONSTRAINT tender_request_custom_types_custom_type_check CHECK (((custom_type)::text = ANY ((ARRAY['BAG'::character varying, 'CARD'::character varying, 'STICKER'::character varying, 'TEMPLATE_BOX'::character varying])::text[])))
);

CREATE TABLE public.tender_request_logos (
    tender_request_id character varying(255) NOT NULL,
    file_url character varying(255) NOT NULL
);

CREATE TABLE public.tender_requests (
    id character varying(255) NOT NULL,
    budget bigint,
    buyer_user_id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    custom_spec text,
    delivery_address_detail character varying(255) NOT NULL,
    delivery_area_code character varying(255) NOT NULL,
    delivery_deadline date NOT NULL,
    product_id character varying(255),
    quantity integer NOT NULL,
    source_order_id character varying(255),
    status character varying(255) NOT NULL,
    target_vendor_id character varying(255),
    type character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    CONSTRAINT tender_requests_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'AWARDED'::character varying, 'CLOSED'::character varying, 'EXPIRED'::character varying])::text[]))),
    CONSTRAINT tender_requests_type_check CHECK (((type)::text = ANY ((ARRAY['DIRECT'::character varying, 'OPEN'::character varying])::text[])))
);

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tender_invitations
    ADD CONSTRAINT tender_invitations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tender_request_custom_types
    ADD CONSTRAINT tender_request_custom_types_pkey PRIMARY KEY (tender_request_id, custom_type);

ALTER TABLE ONLY public.tender_requests
    ADD CONSTRAINT tender_requests_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tender_invitations
    ADD CONSTRAINT ukee3dv4k999039hukckbrb0gq8 UNIQUE (tender_request_id, vendor_id);

ALTER TABLE ONLY public.tender_request_logos
    ADD CONSTRAINT fkfghm6lgoxwsra0w8saxd66lrh FOREIGN KEY (tender_request_id) REFERENCES public.tender_requests(id);

ALTER TABLE ONLY public.tender_request_custom_types
    ADD CONSTRAINT fkfpwjfo0v6c1m67rrbycfsqiey FOREIGN KEY (tender_request_id) REFERENCES public.tender_requests(id);

ALTER TABLE ONLY public.tender_invitations
    ADD CONSTRAINT fki543s0hw2h8g78r8xfqe8gmi1 FOREIGN KEY (tender_request_id) REFERENCES public.tender_requests(id);

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT fktqkwdnhcnqfycvliuma6dr3nw FOREIGN KEY (tender_request_id) REFERENCES public.tender_requests(id);
