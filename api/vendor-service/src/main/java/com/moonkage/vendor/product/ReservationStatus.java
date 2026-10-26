package com.moonkage.vendor.product;

/**
 * Stock held for a checkout (BR-28, P-01): held while the buyer pays, committed when paid, released when the
 * payment fails or the hold expires. A payment that arrives after the release takes the stock again if it is there.
 */
public enum ReservationStatus {
    HELD,
    COMMITTED,
    RELEASED;

    public boolean canTransitionTo(ReservationStatus target) {
        return switch (this) {
            case HELD -> target == COMMITTED || target == RELEASED;
            case RELEASED -> target == COMMITTED;
            case COMMITTED -> false;
        };
    }
}
