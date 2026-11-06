-- order_db: the chat moves from one thread per order to one conversation per buyer and Shop, so a buyer can ask a
-- Shop before buying (decided 2026-11-06). The order chat of V2026_11_06_1000 was never released: its tables go.

DROP TABLE IF EXISTS chat_reads;
DROP TABLE IF EXISTS chat_messages;

CREATE TABLE chat_conversations (
    id               varchar(36)  NOT NULL,
    buyer_account_id varchar(36)  NOT NULL,
    -- names as they were when the conversation started, for the inbox of the other side
    buyer_name       varchar(100),
    vendor_id        varchar(36)  NOT NULL,
    vendor_name      varchar(255),
    last_message_at  timestamptz,
    created_at       timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT chat_conversations_pkey PRIMARY KEY (id),
    -- one conversation per buyer and Shop
    CONSTRAINT uq_chat_conversations_pair UNIQUE (buyer_account_id, vendor_id)
);
-- the inbox of a Shop, newest first
CREATE INDEX ix_chat_conversations_vendor ON chat_conversations (vendor_id, last_message_at DESC NULLS LAST);

CREATE TABLE chat_messages (
    -- the order inside the conversation; also the cursor of "older messages" and of the read marker
    seq                     bigint GENERATED ALWAYS AS IDENTITY,
    id                      varchar(36)  NOT NULL,
    conversation_id         varchar(36)  NOT NULL,
    sender_account_id       varchar(36)  NOT NULL,
    sender_party            varchar(10)  NOT NULL,
    body                    text,
    attachment_key          varchar(255),
    attachment_name         varchar(255),
    attachment_content_type varchar(100),
    created_at              timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
    CONSTRAINT uq_chat_messages_seq UNIQUE (seq),
    CONSTRAINT fk_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations (id),
    CONSTRAINT ck_chat_messages_party CHECK (sender_party IN ('BUYER', 'VENDOR')),
    CONSTRAINT ck_chat_messages_body_length CHECK (body IS NULL OR char_length(body) <= 2000),
    -- a message says something: text, a file, or both
    CONSTRAINT ck_chat_messages_not_empty CHECK ((body IS NOT NULL AND btrim(body) <> '') OR attachment_key IS NOT NULL),
    CONSTRAINT ck_chat_messages_attachment CHECK (
        attachment_key IS NULL OR (attachment_name IS NOT NULL AND attachment_content_type IS NOT NULL))
);
CREATE INDEX ix_chat_messages_conversation_seq ON chat_messages (conversation_id, seq DESC);

-- how far each side has read; only ever moves forward
CREATE TABLE chat_reads (
    conversation_id varchar(36) NOT NULL,
    party           varchar(10) NOT NULL,
    last_read_seq   bigint      NOT NULL,
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chat_reads_pkey PRIMARY KEY (conversation_id, party),
    CONSTRAINT fk_chat_reads_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations (id),
    CONSTRAINT ck_chat_reads_party CHECK (party IN ('BUYER', 'VENDOR'))
);
