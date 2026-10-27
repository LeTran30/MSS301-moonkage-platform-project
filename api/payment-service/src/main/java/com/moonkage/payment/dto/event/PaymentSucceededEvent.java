package com.moonkage.payment.dto.event;

import java.time.Instant;

/**
 * payment.succeeded (payment.md, "Sự kiện"): vendor-service reads exactly these fields. Sent once per payment, never
 * for a DUPLICATE (P-03). A success may come after payment.failed for the same payment when VNPay confirms late;
 * the owner of the reference then decides (P-01).
 *
 * @param purpose PaymentPurpose name; consumers keep it a string so a purpose they do not handle is ignored
 * @param amount whole VND
 */
public record PaymentSucceededEvent(
        String eventId, String paymentId, String purpose, String referenceId, long amount, Instant paidAt) {}
