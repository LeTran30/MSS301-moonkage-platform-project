-- order_db: a Shop may also reject a custom order before work starts (DEPOSITED), as long as it took none of the
-- deposit (Q-01). The deposit goes back to the buyer's wallet in payment-service.
ALTER TABLE orders DROP CONSTRAINT ck_orders_kind_status;
ALTER TABLE orders ADD CONSTRAINT ck_orders_kind_status CHECK (
    (kind = 'BUY_NOW' AND status IN ('PAID', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'REJECTED'))
    OR (kind = 'CUSTOM_ORDER' AND status IN ('DEPOSITED', 'AWAITING_MOCKUP_APPROVAL', 'IN_PRODUCTION',
                                            'READY_TO_SHIP', 'DELIVERED', 'COMPLETED', 'REJECTED')))
    NOT VALID;
