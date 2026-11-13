package com.moonkage.order.enums;

/**
 * 7.1 Order.status.
 * <ul>
 *   <li>BUY_NOW: PAID -> CONFIRMED -> SHIPPING -> DELIVERED -> COMPLETED; or PAID -> REJECTED when the Shop
 *       refuses it (Q-01: the money goes back to the buyer's wallet).
 *   <li>CUSTOM_ORDER: DEPOSITED -> AWAITING_MOCKUP_APPROVAL -> IN_PRODUCTION
 *       -> READY_TO_SHIP -> DELIVERED -> COMPLETED.
 * </ul>
 * Cancel states pending Q-01.
 */
public enum OrderStatus {
    PAID,
    CONFIRMED,
    SHIPPING,
    DEPOSITED,
    AWAITING_MOCKUP_APPROVAL,
    IN_PRODUCTION,
    READY_TO_SHIP,
    DELIVERED,
    COMPLETED,
    /** BUY_NOW only: the Shop refused the paid order; final. */
    REJECTED
}
