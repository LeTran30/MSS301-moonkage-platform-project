-- Baseline: the order-service schema as Hibernate built it from the entities on 2026-10-20 (pg_dump --schema-only).
-- Never edit this file: add a new V<yyyy_MM_dd_HHmm>__<what>.sql instead (docs/guides/database.md).

CREATE TABLE public.cart_items (
    id character varying(255) NOT NULL,
    buyer_user_id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    product_id character varying(255) NOT NULL,
    quantity integer NOT NULL,
    updated_at timestamp(6) without time zone,
    vendor_id character varying(255) NOT NULL
);

CREATE TABLE public.dispute_evidences (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    file_url character varying(255) NOT NULL,
    note text,
    party character varying(255) NOT NULL,
    dispute_id character varying(255) NOT NULL,
    CONSTRAINT dispute_evidences_party_check CHECK (((party)::text = ANY ((ARRAY['BUYER'::character varying, 'VENDOR'::character varying])::text[])))
);

CREATE TABLE public.disputes (
    id character varying(255) NOT NULL,
    buyer_user_id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    decision character varying(255),
    decision_reason text,
    description text NOT NULL,
    reason character varying(255) NOT NULL,
    refund_amount bigint,
    resolved_at timestamp(6) without time zone,
    status character varying(255) NOT NULL,
    order_id character varying(255) NOT NULL,
    CONSTRAINT disputes_decision_check CHECK (((decision)::text = ANY ((ARRAY['FULL_REFUND'::character varying, 'PARTIAL_REFUND'::character varying, 'REJECTED'::character varying])::text[]))),
    CONSTRAINT disputes_reason_check CHECK (((reason)::text = ANY ((ARRAY['WRONG_ITEM'::character varying, 'DAMAGED'::character varying, 'LATE_DELIVERY'::character varying, 'WRONG_LOGO'::character varying, 'OTHER'::character varying])::text[]))),
    CONSTRAINT disputes_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'RESOLVED'::character varying])::text[])))
);

CREATE TABLE public.mockup_versions (
    id character varying(255) NOT NULL,
    file_url character varying(255) NOT NULL,
    review_note text,
    review_status character varying(255) NOT NULL,
    reviewed_at timestamp(6) without time zone,
    uploaded_at timestamp(6) without time zone,
    version_no integer NOT NULL,
    order_id character varying(255) NOT NULL,
    CONSTRAINT mockup_versions_review_status_check CHECK (((review_status)::text = ANY ((ARRAY['PENDING_REVIEW'::character varying, 'APPROVED'::character varying, 'CHANGES_REQUESTED'::character varying])::text[])))
);

CREATE TABLE public.order_items (
    id character varying(255) NOT NULL,
    product_id character varying(255) NOT NULL,
    product_name character varying(255) NOT NULL,
    quantity integer NOT NULL,
    subtotal bigint NOT NULL,
    unit_price bigint NOT NULL,
    order_id character varying(255) NOT NULL
);

CREATE TABLE public.orders (
    id character varying(255) NOT NULL,
    buyer_user_id character varying(255) NOT NULL,
    checkout_id character varying(255),
    created_at timestamp(6) without time zone,
    delivered_at timestamp(6) without time zone,
    delivery_address_detail character varying(255) NOT NULL,
    delivery_area_code character varying(255) NOT NULL,
    deposit_amount bigint,
    discount_amount bigint NOT NULL,
    has_custom boolean NOT NULL,
    interprovince boolean NOT NULL,
    invoice_file_url character varying(255),
    invoice_address character varying(255),
    invoice_email character varying(255),
    invoice_legal_name character varying(255),
    invoice_tax_code character varying(255),
    items_amount bigint NOT NULL,
    kind character varying(255) NOT NULL,
    quote_id character varying(255),
    received_confirmed_at timestamp(6) without time zone,
    shipping_fee bigint NOT NULL,
    status character varying(255) NOT NULL,
    total_amount bigint NOT NULL,
    tracking_code character varying(255),
    updated_at timestamp(6) without time zone,
    vendor_id character varying(255) NOT NULL,
    voucher_code character varying(255),
    CONSTRAINT orders_kind_check CHECK (((kind)::text = ANY ((ARRAY['BUY_NOW'::character varying, 'CUSTOM_ORDER'::character varying])::text[]))),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['PAID'::character varying, 'CONFIRMED'::character varying, 'SHIPPING'::character varying, 'DEPOSITED'::character varying, 'AWAITING_MOCKUP_APPROVAL'::character varying, 'IN_PRODUCTION'::character varying, 'READY_TO_SHIP'::character varying, 'DELIVERED'::character varying, 'COMPLETED'::character varying])::text[])))
);

CREATE TABLE public.progress_update_photos (
    progress_update_id character varying(255) NOT NULL,
    file_url character varying(255) NOT NULL
);

CREATE TABLE public.progress_updates (
    id character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    milestone character varying(255) NOT NULL,
    note text,
    order_id character varying(255) NOT NULL,
    CONSTRAINT progress_updates_milestone_check CHECK (((milestone)::text = ANY ((ARRAY['PAID'::character varying, 'CONFIRMED'::character varying, 'SHIPPING'::character varying, 'DEPOSITED'::character varying, 'AWAITING_MOCKUP_APPROVAL'::character varying, 'IN_PRODUCTION'::character varying, 'READY_TO_SHIP'::character varying, 'DELIVERED'::character varying, 'COMPLETED'::character varying])::text[])))
);

CREATE TABLE public.reviews (
    id character varying(255) NOT NULL,
    buyer_account_id character varying(255) NOT NULL,
    content text,
    created_at timestamp(6) without time zone,
    order_id character varying(255) NOT NULL,
    product_id character varying(255) NOT NULL,
    rating integer NOT NULL,
    replied_at timestamp(6) without time zone,
    vendor_id character varying(255) NOT NULL,
    vendor_reply text
);

CREATE TABLE public.vouchers (
    id character varying(255) NOT NULL,
    active boolean NOT NULL,
    code character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    discount_amount bigint NOT NULL,
    max_uses integer NOT NULL,
    min_order_amount bigint,
    updated_at timestamp(6) without time zone,
    used_count integer NOT NULL,
    valid_from timestamp(6) without time zone NOT NULL,
    valid_to timestamp(6) without time zone NOT NULL,
    version bigint
);

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.dispute_evidences
    ADD CONSTRAINT dispute_evidences_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.mockup_versions
    ADD CONSTRAINT mockup_versions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.progress_updates
    ADD CONSTRAINT progress_updates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT uk30ftp2biebbvpik8e49wlmady UNIQUE (code);

ALTER TABLE ONLY public.mockup_versions
    ADD CONSTRAINT ukjh63h2ll5fck4axspj2okh7yy UNIQUE (order_id, version_no);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT ukm12vc3pqmrvj20fhl2y1kog15 UNIQUE (order_id, product_id);

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT ukrwgrmb22nxir86soca80cakeg UNIQUE (buyer_user_id, product_id);

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT fk7w9qai75udrw8yjppow8vqxa FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.progress_updates
    ADD CONSTRAINT fk8qmvcutodwy3t3k3csbwmhqxi FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fkbioxgbv59vetrxe0ejfubep1w FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.progress_update_photos
    ADD CONSTRAINT fkciy0rfbwt3ipvxry77ps3m847 FOREIGN KEY (progress_update_id) REFERENCES public.progress_updates(id);

ALTER TABLE ONLY public.mockup_versions
    ADD CONSTRAINT fke1u5ywwgokwtml2pi7vie3y0p FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.dispute_evidences
    ADD CONSTRAINT fkeql9nopjw2kunnxc1h6qshxfn FOREIGN KEY (dispute_id) REFERENCES public.disputes(id);
