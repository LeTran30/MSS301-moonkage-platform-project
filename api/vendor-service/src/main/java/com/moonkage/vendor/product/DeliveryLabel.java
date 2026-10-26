package com.moonkage.vendor.product;

/**
 * Where a product may be delivered (AC-29.3): inside the vendor's areas only, or nationwide by carrier. How the
 * packaging standard for NATIONWIDE is confirmed is open (Q-11), so both are accepted for now.
 */
public enum DeliveryLabel {
    LOCAL,
    NATIONWIDE
}
