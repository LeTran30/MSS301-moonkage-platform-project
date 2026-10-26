package com.moonkage.vendor.product;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.EnumSet;
import org.junit.jupiter.api.Test;

/** BR-28, P-01: held until paid or released; a late payment commits a released hold; nothing leaves COMMITTED. */
class ReservationStatusTest {

    @Test
    void aHoldIsCommittedOrReleasedAndALatePaymentCommitsAReleasedOne() {
        assertTrue(ReservationStatus.HELD.canTransitionTo(ReservationStatus.COMMITTED));
        assertTrue(ReservationStatus.HELD.canTransitionTo(ReservationStatus.RELEASED));
        assertTrue(ReservationStatus.RELEASED.canTransitionTo(ReservationStatus.COMMITTED));
        assertFalse(ReservationStatus.RELEASED.canTransitionTo(ReservationStatus.HELD));
    }

    @Test
    void nothingLeavesCommitted() {
        for (ReservationStatus target : EnumSet.allOf(ReservationStatus.class)) {
            assertFalse(ReservationStatus.COMMITTED.canTransitionTo(target));
        }
    }
}
