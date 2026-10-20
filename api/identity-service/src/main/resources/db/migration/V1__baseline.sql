-- Baseline: the identity-service schema as Hibernate built it from the entities on 2026-10-20 (pg_dump --schema-only).
-- Never edit this file: add a new V<yyyy_MM_dd_HHmm>__<what>.sql instead (docs/guides/database.md).

CREATE TABLE public.accounts (
    id character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    account_verified boolean NOT NULL,
    email character varying(255) NOT NULL,
    nfc_failed_attempts integer DEFAULT 0 NOT NULL,
    nfc_locked_until timestamp(6) with time zone,
    password_changed_at timestamp(6) with time zone,
    password_hash character varying(255) NOT NULL,
    phone_number character varying(20),
    role character varying(20) NOT NULL,
    CONSTRAINT accounts_role_check CHECK (((role)::text = ANY ((ARRAY['MEMBER'::character varying, 'ADMIN'::character varying])::text[])))
);

CREATE TABLE public.addresses (
    id character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    detail character varying(255) NOT NULL,
    is_default boolean NOT NULL,
    label character varying(30),
    province_code character varying(2) NOT NULL,
    province_name character varying(100) NOT NULL,
    recipient_name character varying(100) NOT NULL,
    recipient_phone character varying(10) NOT NULL,
    ward_code character varying(5) NOT NULL,
    ward_name character varying(100) NOT NULL,
    account_id character varying(255) NOT NULL
);

CREATE TABLE public.legal_profiles (
    account_id character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    date_of_birth_enc bytea NOT NULL,
    gender character varying(10) NOT NULL,
    id_hash_key_ver integer NOT NULL,
    id_number_enc bytea NOT NULL,
    id_number_hash character varying(64) NOT NULL,
    id_number_masked character varying(12) NOT NULL,
    legal_name character varying(100) NOT NULL,
    nationality character varying(50) NOT NULL,
    nfc_verified_at timestamp(6) with time zone NOT NULL,
    pii_key_ver integer NOT NULL,
    CONSTRAINT legal_profiles_gender_check CHECK (((gender)::text = ANY ((ARRAY['MALE'::character varying, 'FEMALE'::character varying])::text[])))
);

CREATE TABLE public.outbox_events (
    id character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    attempts integer NOT NULL,
    payload text NOT NULL,
    published_at timestamp(6) with time zone,
    routing_key character varying(100) NOT NULL
);

CREATE TABLE public.user_profiles (
    account_id character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    avatar_url character varying(255),
    full_name character varying(100) NOT NULL
);

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.legal_profiles
    ADD CONSTRAINT legal_profiles_pkey PRIMARY KEY (account_id);

ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT uk_accounts_email UNIQUE (email);

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT uk_accounts_phone_number UNIQUE (phone_number);

ALTER TABLE ONLY public.legal_profiles
    ADD CONSTRAINT uk_legal_profiles_id_hash UNIQUE (id_number_hash, id_hash_key_ver);

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (account_id);

CREATE INDEX ix_outbox_events_unpublished ON public.outbox_events USING btree (published_at);

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT fkaf33clpk1s4svpok3x9egrvji FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE ONLY public.legal_profiles
    ADD CONSTRAINT fkg2lxqf696r5mtube9hn0olhwl FOREIGN KEY (account_id) REFERENCES public.accounts(id);

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT fkm9xh4i2a8u1nei2w5nlqrmb2g FOREIGN KEY (account_id) REFERENCES public.accounts(id);
