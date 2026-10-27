package com.moonkage.payment.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INTERNAL_SERVER_ERROR("COMMON_500", HttpStatus.INTERNAL_SERVER_ERROR, "error.common.internal"),
    INVALID_INPUT("COMMON_400", HttpStatus.BAD_REQUEST, "error.common.invalid_input"),
    MALFORMED_JSON("COMMON_400_JSON", HttpStatus.BAD_REQUEST, "error.common.malformed_json"),
    /** No X-Account-Id / X-User-Role: the call did not come through the gateway with a token. */
    UNAUTHENTICATED("COMMON_401", HttpStatus.UNAUTHORIZED, "error.common.unauthenticated"),
    ACCESS_DENIED("COMMON_403", HttpStatus.FORBIDDEN, "error.common.access_denied"),
    RESOURCE_NOT_FOUND("COMMON_404", HttpStatus.NOT_FOUND, "error.common.resource_not_found"),
    METHOD_NOT_ALLOWED("COMMON_405", HttpStatus.METHOD_NOT_ALLOWED, "error.common.method_not_allowed"),
    INVALID_STATE_TRANSITION("COMMON_409", HttpStatus.CONFLICT, "error.common.invalid_state_transition"),
    /** Another service did not answer, or answered with a server error. */
    DEPENDENCY_UNAVAILABLE("COMMON_503", HttpStatus.SERVICE_UNAVAILABLE, "error.common.dependency_unavailable"),

    // Payments (FR-09, FR-19, FR-22, BR-25, BR-29, BR-31)
    /** Also answered for someone else's payment, so its existence does not leak. */
    PAYMENT_NOT_FOUND("PAYMENT_001", HttpStatus.NOT_FOUND, "error.payment.not_found"),
    /** P-03: the purpose and reference already have a successful payment. */
    PAYMENT_ALREADY_PAID("PAYMENT_002", HttpStatus.CONFLICT, "error.payment.already_paid"),
    /** BR-29: allocations only for CHECKOUT, and they add up to the amount. */
    ALLOCATIONS_INVALID("PAYMENT_003", HttpStatus.BAD_REQUEST, "error.payment.allocations_invalid"),
    /** A VNPay redirect whose vnp_SecureHash does not match: forged or altered. */
    GATEWAY_SIGNATURE_INVALID("PAYMENT_004", HttpStatus.BAD_REQUEST, "error.payment.gateway_signature_invalid"),
    /** VNPAY_TMN_CODE or VNPAY_HASH_SECRET missing in .env. */
    GATEWAY_NOT_CONFIGURED("PAYMENT_005", HttpStatus.SERVICE_UNAVAILABLE, "error.payment.gateway_not_configured"),
    PAYMENT_EXPIRY_INVALID("PAYMENT_006", HttpStatus.BAD_REQUEST, "error.payment.expiry_invalid"),

    // Ledgers (FR-41, FR-43, FR-47, FR-48, NFR-09)
    /** Also answered for an order whose money the caller may not see. */
    LEDGER_NOT_FOUND("LEDGER_001", HttpStatus.NOT_FOUND, "error.ledger.not_found"),
    /** NFR-09: more than the platform still holds for the order. */
    LEDGER_INSUFFICIENT("LEDGER_002", HttpStatus.CONFLICT, "error.ledger.insufficient"),
    DISBURSEMENT_NOT_FOUND("LEDGER_003", HttpStatus.NOT_FOUND, "error.ledger.disbursement_not_found"),
    /** FR-41: only the deposit of a custom order not paid out yet. */
    DISBURSEMENT_NOT_ALLOWED("LEDGER_004", HttpStatus.CONFLICT, "error.ledger.disbursement_not_allowed"),
    /** AC-41.2: approved, waiting and new together exceed the deposit held. */
    DISBURSEMENT_OVER_HELD("LEDGER_005", HttpStatus.CONFLICT, "error.ledger.disbursement_over_held"),
    /** FR-47: a rejection says why. */
    REASON_REQUIRED("LEDGER_006", HttpStatus.BAD_REQUEST, "error.ledger.reason_required"),
    /** FR-48, P-02: not received nor past the complaint deadline, a dispute open, or a refund or request pending. */
    PAYOUT_NOT_ELIGIBLE("LEDGER_007", HttpStatus.CONFLICT, "error.ledger.payout_not_eligible"),
    ALREADY_PAID_OUT("LEDGER_008", HttpStatus.CONFLICT, "error.ledger.already_paid_out"),

    // Refunds (AC-49.3)
    REFUND_NOT_FOUND("REFUND_001", HttpStatus.NOT_FOUND, "error.refund.not_found");

    private final String code;
    private final HttpStatus httpStatus;
    private final String messageKey;
}
