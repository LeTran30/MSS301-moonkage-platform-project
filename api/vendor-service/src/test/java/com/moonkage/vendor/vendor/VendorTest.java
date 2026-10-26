package com.moonkage.vendor.vendor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.ProvinceCode;
import com.moonkage.vendor.vendor.vo.RepresentativeName;
import com.moonkage.vendor.vendor.vo.TaxCode;
import org.junit.jupiter.api.Test;

/** The vendor's status moves only along VendorStatus.canTransitionTo (FR-27, FR-45). */
class VendorTest {

    @Test
    void aRegisteredVendorWaitsForReviewAndCannotOperate() {
        Vendor vendor = Vendor.register("owner-1", profile("Tiệm A"));

        assertEquals(VendorStatus.PENDING, vendor.getStatus());
        assertTrue(vendor.isOwnedBy("owner-1"));
        assertFalse(vendor.isOwnedBy("someone-else"));
        assertFalse(vendor.canOperate());
    }

    @Test
    void aDecisionNeedingInfoKeepsTheReasonAndAResubmissionClearsIt() {
        Vendor vendor = Vendor.register("owner-1", profile("Tiệm A"));

        vendor.decide(ReviewDecision.NEEDS_INFO, "Ảnh giấy phép bị mờ");
        assertEquals(VendorStatus.NEEDS_INFO, vendor.getStatus());
        assertEquals("Ảnh giấy phép bị mờ", vendor.getStatusReason());

        vendor.resubmit(profile("Tiệm B"));
        assertEquals(VendorStatus.PENDING, vendor.getStatus());
        assertNull(vendor.getStatusReason());
        assertEquals("Tiệm B", vendor.getBusinessName());
    }

    @Test
    void anApprovedVendorStillNeedsTheRegistrationFeeToOperate() {
        Vendor vendor = Vendor.register("owner-1", profile("Tiệm A"));

        vendor.decide(ReviewDecision.APPROVE, null);

        assertEquals(VendorStatus.APPROVED, vendor.getStatus());
        assertFalse(vendor.canOperate());
    }

    @Test
    void aPendingProfileCannotBeResubmittedAndAnApprovedOneCannotBeDecidedAgain() {
        Vendor vendor = Vendor.register("owner-1", profile("Tiệm A"));
        assertInvalidTransition(() -> vendor.resubmit(profile("Tiệm B")));

        vendor.decide(ReviewDecision.APPROVE, null);
        assertInvalidTransition(() -> vendor.decide(ReviewDecision.REJECT, "Sai"));
        assertInvalidTransition(() -> vendor.resubmit(profile("Tiệm B")));
    }

    @Test
    void onlyRefusalsNeedAReason() {
        assertFalse(ReviewDecision.APPROVE.requiresReason());
        assertTrue(ReviewDecision.NEEDS_INFO.requiresReason());
        assertTrue(ReviewDecision.REJECT.requiresReason());
    }

    private static void assertInvalidTransition(Runnable change) {
        AppException e = assertThrows(AppException.class, change::run);
        assertEquals(ErrorCode.INVALID_STATE_TRANSITION, e.getErrorCode());
    }

    private static VendorProfile profile(String businessName) {
        return new VendorProfile(
                businessName,
                VendorEntityType.HOUSEHOLD_BUSINESS,
                TaxCode.of("0312345678"),
                "12 Lê Lợi",
                ProvinceCode.of("79"),
                RepresentativeName.of("NGUYEN VAN A"),
                new HashedIdNumber("a".repeat(64), 1, "********1234"),
                SupplySource.SELF_PRODUCED,
                true,
                false,
                BankAccount.of(
                        "Vietcombank",
                        "NGUYEN VAN A",
                        new EncryptedBankAccountNumber(new byte[] {1}, 1, "******6789")));
    }
}
