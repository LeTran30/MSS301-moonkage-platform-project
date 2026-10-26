package com.moonkage.vendor.vendor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.vendor.vo.DeliveryFee;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/** FR-46, BR-20: a locked vendor stops operating and its selling settings stay as they were. */
class VendorLockTest {

    @Test
    void anOperatingVendorLockedNoLongerOperates() {
        Vendor vendor = approved();
        vendor.recordRegistrationFee("payment-1", new Price(200_000), Instant.parse("2026-10-26T03:00:00Z"));

        vendor.lock("Bán hàng giả");

        assertEquals(VendorStatus.LOCKED, vendor.getStatus());
        assertEquals("Bán hàng giả", vendor.getStatusReason());
        assertFalse(vendor.canOperate());
    }

    @Test
    void onlyAnApprovedVendorIsLocked() {
        Vendor pending = Vendor.register("owner-1", VendorTestData.profile());

        assertError(ErrorCode.INVALID_STATE_TRANSITION, () -> pending.lock("Sai"));
    }

    @Test
    void aLockedVendorCannotChangeItsDeliveryFee() {
        Vendor vendor = approved();
        vendor.changeLocalDeliveryFee(new DeliveryFee(15_000));
        vendor.lock("Bán hàng giả");

        assertError(ErrorCode.VENDOR_NOT_APPROVED, () -> vendor.changeLocalDeliveryFee(new DeliveryFee(0)));
        assertEquals(new DeliveryFee(15_000), vendor.getLocalDeliveryFee());
    }

    private static Vendor approved() {
        Vendor vendor = Vendor.register("owner-1", VendorTestData.profile());
        vendor.decide(ReviewDecision.APPROVE, null);
        return vendor;
    }

    private static void assertError(ErrorCode expected, Runnable action) {
        AppException e = assertThrows(AppException.class, action::run);
        assertEquals(expected, e.getErrorCode());
    }
}
