package com.moonkage.vendor.vendor;

import java.time.Instant;
import java.util.UUID;

/**
 * vendor.registration_fee_paid: the vendor paid its registration fee (BR-31, AC-27.5). orchestrator-service tells the
 * owner and the admins (who then attach the invoice, Q-36) and writes the audit log.
 */
public record VendorRegistrationFeePaidEvent(
        String eventId,
        String vendorId,
        String ownerAccountId,
        String paymentId,
        long amount,
        Instant paidAt,
        boolean canOperate) {

    static VendorRegistrationFeePaidEvent of(Vendor vendor) {
        return new VendorRegistrationFeePaidEvent(
                UUID.randomUUID().toString(),
                vendor.getId(),
                vendor.getOwnerAccountId(),
                vendor.getRegistrationFeePaymentId(),
                vendor.getRegistrationFeeAmount().value(),
                vendor.getRegistrationFeePaidAt(),
                vendor.canOperate());
    }
}
