-- Baseline: the orchestrator-service schema as Hibernate built it from the entities on 2026-10-20 (pg_dump --schema-only).
-- Never edit this file: add a new V<yyyy_MM_dd_HHmm>__<what>.sql instead (docs/guides/database.md).

CREATE TABLE public.audit_logs (
    id character varying(255) NOT NULL,
    action character varying(255) NOT NULL,
    actor_account_id character varying(255) NOT NULL,
    after_value text,
    before_value text,
    occurred_at timestamp(6) with time zone NOT NULL,
    reason text,
    received_at timestamp(6) with time zone NOT NULL,
    source_service character varying(255) NOT NULL,
    target_id character varying(255) NOT NULL,
    target_type character varying(255) NOT NULL
);

CREATE TABLE public.notification_event_logs (
    event_id character varying(64) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    error_message text,
    recipient character varying(255) NOT NULL,
    sent_at timestamp(6) with time zone,
    status character varying(20) NOT NULL,
    subject character varying(255) NOT NULL,
    template_code character varying(255) NOT NULL,
    CONSTRAINT notification_event_logs_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SENT'::character varying, 'FAILED'::character varying])::text[])))
);

CREATE TABLE public.notifications (
    id character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    is_read boolean NOT NULL,
    recipient_account_id character varying(255) NOT NULL,
    target_url character varying(255),
    title character varying(255) NOT NULL,
    type character varying(64) NOT NULL
);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notification_event_logs
    ADD CONSTRAINT notification_event_logs_pkey PRIMARY KEY (event_id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

CREATE INDEX idx_audit_actor ON public.audit_logs USING btree (actor_account_id);

CREATE INDEX idx_audit_target ON public.audit_logs USING btree (target_type, target_id);

CREATE INDEX idx_notification_created_at ON public.notifications USING btree (created_at);

CREATE INDEX idx_notification_event_recipient ON public.notification_event_logs USING btree (recipient);

CREATE INDEX idx_notification_event_status ON public.notification_event_logs USING btree (status);

CREATE INDEX idx_notification_recipient ON public.notifications USING btree (recipient_account_id, is_read);
