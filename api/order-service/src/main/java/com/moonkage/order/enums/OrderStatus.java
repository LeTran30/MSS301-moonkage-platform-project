package com.moonkage.order.enums;

/**
 * 7.1 Order.status.
 * <ul>
 *   <li>BUY_NOW: PAID -> CONFIRMED -> SHIPPING -> DELIVERED -> COMPLETED.
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
    COMPLETED
}
