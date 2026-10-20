-- Baseline: the vendor-service schema as Hibernate built it from the entities on 2026-10-20 (pg_dump --schema-only).
-- Never edit this file: add a new V<yyyy_MM_dd_HHmm>__<what>.sql instead (docs/guides/database.md).

CREATE TABLE public.order_profile_custom_types (
    order_profile_id character varying(255) NOT NULL,
    custom_type character varying(255) NOT NULL,
    CONSTRAINT order_profile_custom_types_custom_type_check CHECK (((custom_type)::text = ANY ((ARRAY['BAG'::character varying, 'CARD'::character varying, 'STICKER'::character varying, 'TEMPLATE_BOX'::character varying])::text[])))
);

CREATE TABLE public.order_profiles (
    id character varying(255) NOT NULL,
    cake_types character varying(255),
    created_at timestamp(6) without time zone,
    distributed_brands character varying(255),
    early_bird_offer text,
    gatherable_qty integer,
    lead_time_days integer NOT NULL,
    logo_printing boolean,
    min_qty integer NOT NULL,
    packaging_types character varying(255),
    updated_at timestamp(6) without time zone,
    weekly_capacity integer,
    vendor_id character varying(255) NOT NULL
);

CREATE TABLE public.ref_price_tiers (
    id character varying(255) NOT NULL,
    from_qty integer NOT NULL,
    unit_price bigint NOT NULL,
    order_profile_id character varying(255) NOT NULL
);

CREATE TABLE public.vendor_delivery_areas (
    id character varying(255) NOT NULL,
    area_code character varying(255) NOT NULL,
    vendor_id character varying(255) NOT NULL
);

CREATE TABLE public.vendors (
    id character varying(255) NOT NULL,
    accepts_orders boolean NOT NULL,
    address character varying(255) NOT NULL,
    area_code character varying(255) NOT NULL,
    account_holder character varying(255),
    account_number character varying(255),
    bank_name character varying(255),
    created_at timestamp(6) without time zone,
    entity_type character varying(255) NOT NULL,
    legal_name character varying(255) NOT NULL,
    owner_account_id character varying(255) NOT NULL,
    sells_shop boolean NOT NULL,
    status character varying(255) NOT NULL,
    status_reason text,
    supply_source character varying(255) NOT NULL,
    tax_code character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    CONSTRAINT vendors_entity_type_check CHECK (((entity_type)::text = ANY ((ARRAY['ENTERPRISE'::character varying, 'HOUSEHOLD_BUSINESS'::character varying])::text[]))),
    CONSTRAINT vendors_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'NEEDS_INFO'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'LOCKED'::character varying])::text[]))),
    CONSTRAINT vendors_supply_source_check CHECK (((supply_source)::text = ANY ((ARRAY['SELF_PRODUCED'::character varying, 'RESELL'::character varying, 'BOTH'::character varying])::text[])))
);

ALTER TABLE ONLY public.order_profile_custom_types
    ADD CONSTRAINT order_profile_custom_types_pkey PRIMARY KEY (order_profile_id, custom_type);

ALTER TABLE ONLY public.order_profiles
    ADD CONSTRAINT order_profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ref_price_tiers
    ADD CONSTRAINT ref_price_tiers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.vendor_delivery_areas
    ADD CONSTRAINT uk535e3xpocjv51ri9829ga9ihw UNIQUE (vendor_id, area_code);

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT ukdu5cibb61aaw9507n483v1m80 UNIQUE (owner_account_id);

ALTER TABLE ONLY public.order_profiles
    ADD CONSTRAINT ukrd7a3eec3l3vu78m4ipdxqvo4 UNIQUE (vendor_id);

ALTER TABLE ONLY public.vendor_delivery_areas
    ADD CONSTRAINT vendor_delivery_areas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ref_price_tiers
    ADD CONSTRAINT fk4bhi4248lfpplifbsjseaglc7 FOREIGN KEY (order_profile_id) REFERENCES public.order_profiles(id);

ALTER TABLE ONLY public.order_profiles
    ADD CONSTRAINT fk5bnh1jay0mlc0f20rp61yt7s1 FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);

ALTER TABLE ONLY public.vendor_delivery_areas
    ADD CONSTRAINT fkc8dtaw3xj6l8ea3obm6rx0bgb FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);

ALTER TABLE ONLY public.order_profile_custom_types
    ADD CONSTRAINT fkhlo5a5w4u9if9gm1e55xae0k5 FOREIGN KEY (order_profile_id) REFERENCES public.order_profiles(id);
