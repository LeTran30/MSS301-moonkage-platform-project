-- Baseline: the catalog-service schema as Hibernate built it from the entities on 2026-10-20 (pg_dump --schema-only).
-- Never edit this file: add a new V<yyyy_MM_dd_HHmm>__<what>.sql instead (docs/guides/database.md).

CREATE TABLE public.product_images (
    product_id character varying(255) NOT NULL,
    object_key character varying(255) NOT NULL
);

CREATE TABLE public.product_price_tiers (
    id character varying(255) NOT NULL,
    from_qty integer NOT NULL,
    unit_price bigint NOT NULL,
    product_id character varying(255) NOT NULL
);

CREATE TABLE public.products (
    id character varying(255) NOT NULL,
    brand character varying(255),
    cake_type character varying(255),
    created_at timestamp(6) without time zone,
    deleted boolean NOT NULL,
    delivery_label character varying(255) NOT NULL,
    description text NOT NULL,
    expiry_date date NOT NULL,
    list_price bigint NOT NULL,
    name character varying(255) NOT NULL,
    origin character varying(255),
    pieces_per_box integer,
    quote_threshold integer,
    removed_reason text,
    status character varying(255) NOT NULL,
    stock integer NOT NULL,
    updated_at timestamp(6) without time zone,
    vendor_id character varying(255) NOT NULL,
    version bigint,
    CONSTRAINT products_delivery_label_check CHECK (((delivery_label)::text = ANY ((ARRAY['LOCAL'::character varying, 'NATIONWIDE'::character varying])::text[]))),
    CONSTRAINT products_status_check CHECK (((status)::text = ANY ((ARRAY['ON_SALE'::character varying, 'HIDDEN'::character varying, 'REMOVED'::character varying])::text[])))
);

ALTER TABLE ONLY public.product_price_tiers
    ADD CONSTRAINT product_price_tiers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_price_tiers
    ADD CONSTRAINT ukby17bpxg1kke9j6r1ka2elovx UNIQUE (product_id, from_qty);

ALTER TABLE ONLY public.product_price_tiers
    ADD CONSTRAINT fk5exrpb1k34gh17d7gdy13x1sy FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT fkqnq71xsohugpqwf3c9gxmsuy FOREIGN KEY (product_id) REFERENCES public.products(id);
