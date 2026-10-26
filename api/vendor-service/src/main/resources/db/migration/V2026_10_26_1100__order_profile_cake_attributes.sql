-- vendor_db: the crusts and fillings an order profile can make (AC-35.2), chosen in the FR-54 catalogue (decision
-- L-19). The free-text cake_types column gives way to links, like product_cake_attributes; what it held was never
-- read by any service, so it is dropped without a backfill.
CREATE TABLE order_profile_cake_attributes (
    order_profile_id varchar(255) NOT NULL,
    attribute_id     varchar(36)  NOT NULL,
    CONSTRAINT order_profile_cake_attributes_pkey PRIMARY KEY (order_profile_id, attribute_id),
    CONSTRAINT fk_order_profile_cake_attributes_profile
        FOREIGN KEY (order_profile_id) REFERENCES order_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_profile_cake_attributes_attribute
        FOREIGN KEY (attribute_id) REFERENCES cake_attributes (id)
);
CREATE INDEX ix_order_profile_cake_attributes_attribute ON order_profile_cake_attributes (attribute_id);

ALTER TABLE order_profiles DROP COLUMN cake_types;
