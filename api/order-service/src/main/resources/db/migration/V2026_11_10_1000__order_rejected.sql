-- order_db: a Shop may reject a paid buy-now order before confirming it (Q-01). The money of that order goes back to
-- the buyer's wallet in payment-service; the other Shops' orders of the same checkout are not touched.
-- The reason is kept in the order's progress history (progress_updates.note), like every other step.

ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
    'PAID', 'CONFIRMED', 'SHIPPING', 'DEPOSITED', 'AWAITING_MOCKUP_APPROVAL', 'IN_PRODUCTION', 'READY_TO_SHIP',
    'DELIVERED', 'COMPLETED', 'REJECTED'));

ALTER TABLE orders DROP CONSTRAINT ck_orders_kind_status;
ALTER TABLE orders ADD CONSTRAINT ck_orders_kind_status CHECK (
    (kind = 'BUY_NOW' AND status IN ('PAID', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'REJECTED'))
    OR (kind = 'CUSTOM_ORDER' AND status IN ('DEPOSITED', 'AWAITING_MOCKUP_APPROVAL', 'IN_PRODUCTION',
                                            'READY_TO_SHIP', 'DELIVERED', 'COMPLETED')))
    NOT VALID;

ALTER TABLE progress_updates DROP CONSTRAINT progress_updates_milestone_check;
ALTER TABLE progress_updates ADD CONSTRAINT progress_updates_milestone_check CHECK (milestone IN (
    'PAID', 'CONFIRMED', 'SHIPPING', 'DEPOSITED', 'AWAITING_MOCKUP_APPROVAL', 'IN_PRODUCTION', 'READY_TO_SHIP',
    'DELIVERED', 'COMPLETED', 'REJECTED'));
