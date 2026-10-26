package com.moonkage.vendor.vendor;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Price;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/** BR-31: an approved vendor pays the registration fee once, and only then operates (AC-27.4, AC-27.5). */
class VendorRegistrationFeeTest {

    private static final Instant PAID_AT = Instant.parse("2026-10-26T03:00:00Z");

    @Test
    void aPendingVendorCannotPayYet() {
        Vendor vendor = Vendor.register("owner-1", VendorTestData.profile());

        assertError(ErrorCode.VENDOR_NOT_APPROVED, vendor::checkRegistrationFeePayable);
    }

    @Test
    void anApprovedVendorPaysOnceAndThenOperates() {
        Vendor vendor = approved();
        assertDoesNotThrow(vendor::checkRegistrationFeePayable);

        assertTrue(vendor.recordRegistrationFee("payment-1", new Price(200_000), PAID_AT));

        assertTrue(vendor.canOperate());
        assertEquals(new Price(200_000), vendor.getRegistrationFeeAmount());
        assertError(ErrorCode.REGISTRATION_FEE_ALREADY_PAID, vendor::checkRegistrationFeePayable);
    }

    @Test
    void aSecondPaymentDoesNotReplaceTheFirst() {
        Vendor vendor = approved();
        vendor.recordRegistrationFee("payment-1", new Price(200_000), PAID_AT);

        assertFalse(vendor.recordRegistrationFee("payment-2", new Price(250_000), PAID_AT.plusSeconds(60)));

        assertEquals("payment-1", vendor.getRegistrationFeePaymentId());
        assertEquals(PAID_AT, vendor.getRegistrationFeePaidAt());
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
