package com.moonkage.quotation.dto.client;

/**
 * payment-service POST /internal/refunds.
 *
 * @param reason QUOTE_EXPIRED: the deposit arrived after the quote could no longer be accepted (FR-19)
 */
public record CreateRefundRequest(String paymentId, String reason, long amount) {

    public static final String QUOTE_EXPIRED = "QUOTE_EXPIRED";

    public static CreateRefundRequest quoteExpired(String paymentId, long amount) {
        return new CreateRefundRequest(paymentId, QUOTE_EXPIRED, amount);
    }
}
