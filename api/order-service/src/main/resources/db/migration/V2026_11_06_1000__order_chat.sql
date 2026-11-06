-- order_db: chat between the buyer and the vendor owner of one order (decided 2026-11-06, outside Requirement v1.7).
-- Each order has one conversation; the order id is the thread id, so there is no thread table.

CREATE TABLE chat_messages (
    -- the order inside the thread; also the cursor of "older messages" and of the read marker
    seq                     bigint GENERATED ALWAYS AS IDENTITY,
    id                      varchar(36)  NOT NULL,
    order_id                varchar(255) NOT NULL,
    sender_account_id       varchar(36)  NOT NULL,
    sender_party            varchar(10)  NOT NULL,
    body                    text,
    attachment_key          varchar(255),
    attachment_name         varchar(255),
    attachment_content_type varchar(100),
    created_at              timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
    CONSTRAINT uq_chat_messages_seq UNIQUE (seq),
    CONSTRAINT fk_chat_messages_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT ck_chat_messages_party CHECK (sender_party IN ('BUYER', 'VENDOR')),
    CONSTRAINT ck_chat_messages_body_length CHECK (body IS NULL OR char_length(body) <= 2000),
    -- a message says something: text, a file, or both
    CONSTRAINT ck_chat_messages_not_empty CHECK ((body IS NOT NULL AND btrim(body) <> '') OR attachment_key IS NOT NULL),
    CONSTRAINT ck_chat_messages_attachment CHECK (
        attachment_key IS NULL
        OR (attachment_name IS NOT NULL AND attachment_content_type IS NOT NULL))
);
-- the thread, newest page first
CREATE INDEX ix_chat_messages_order_seq ON chat_messages (order_id, seq DESC);

-- how far each side has read; only ever moves forward
CREATE TABLE chat_reads (
    order_id      varchar(255) NOT NULL,
    party         varchar(10)  NOT NULL,
    last_read_seq bigint       NOT NULL,
    updated_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT chat_reads_pkey PRIMARY KEY (order_id, party),
    CONSTRAINT fk_chat_reads_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT ck_chat_reads_party CHECK (party IN ('BUYER', 'VENDOR'))
);
