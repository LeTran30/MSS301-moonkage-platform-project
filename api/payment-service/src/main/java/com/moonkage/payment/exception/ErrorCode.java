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
    PAYMENT_EXPIRY_INVALID("PAYMENT_006", HttpStatus.BAD_REQUEST, "error.payment.expiry_invalid");

    private final String code;
    private final HttpStatus httpStatus;
    private final String messageKey;
}
