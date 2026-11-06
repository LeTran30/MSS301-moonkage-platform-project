package com.moonkage.api;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * The error codes every service answers a framework failure with.
 *
 * <p>They used to be written out again in each service's own {@code ErrorCode} enum, which meant the same code string
 * existed in five places and could drift apart. The codes live here so there is exactly one list; a service's own
 * {@code ErrorCode} still holds its business codes and delegates its common ones to these constants.
 *
 * <p>The {@code messageKey} names a line of the service's own {@code messages.properties}; every service keeps its own
 * bundle, so the text stays the service's own (see the audit findings H-02 and H-03).
 */
@Getter
@RequiredArgsConstructor
public enum CommonErrorCode {

    // ─── The framework failures the shared exception handler answers with ───
    INTERNAL_SERVER_ERROR("COMMON_500", HttpStatus.INTERNAL_SERVER_ERROR, "error.common.internal"),
    INVALID_INPUT("COMMON_400", HttpStatus.BAD_REQUEST, "error.common.invalid_input"),
    MALFORMED_JSON("COMMON_400_JSON", HttpStatus.BAD_REQUEST, "error.common.malformed_json"),
    /** A required query parameter is missing, e.g. {@code provinceCode} on GET /api/carts/me. */
    PARAMETER_REQUIRED("COMMON_400_PARAM", HttpStatus.BAD_REQUEST, "error.common.parameter_required"),
    /** No X-Account-Id / X-User-Role: the call did not come through the gateway with a token. */
    UNAUTHENTICATED("COMMON_401", HttpStatus.UNAUTHORIZED, "error.common.unauthenticated"),
    ACCESS_DENIED("COMMON_403", HttpStatus.FORBIDDEN, "error.common.access_denied"),
    RESOURCE_NOT_FOUND("COMMON_404", HttpStatus.NOT_FOUND, "error.common.resource_not_found"),
    METHOD_NOT_ALLOWED("COMMON_405", HttpStatus.METHOD_NOT_ALLOWED, "error.common.method_not_allowed"),
    /** A business operation asked of a resource in the wrong status (api-db README, API rule 3). */
    INVALID_STATE_TRANSITION("COMMON_409", HttpStatus.CONFLICT, "error.common.invalid_state_transition"),
    /** Another service did not answer, or answered with a server error. */
    DEPENDENCY_UNAVAILABLE("COMMON_503", HttpStatus.SERVICE_UNAVAILABLE, "error.common.dependency_unavailable"),

    // ─── The finer 400 variants vendor-service already answered with ───
    FIELD_REQUIRED("COMMON_400_REQUIRED", HttpStatus.BAD_REQUEST, "error.common.field_required"),
    TEXT_TOO_LONG("COMMON_400_TOO_LONG", HttpStatus.BAD_REQUEST, "error.common.text_too_long"),
    PROVINCE_CODE_INVALID("COMMON_400_PROVINCE", HttpStatus.BAD_REQUEST, "error.common.province_code_invalid"),
    PRICE_INVALID("COMMON_400_PRICE", HttpStatus.BAD_REQUEST, "error.common.price_invalid"),
    QUANTITY_INVALID("COMMON_400_QUANTITY", HttpStatus.BAD_REQUEST, "error.common.quantity_invalid"),
    PRICE_TIERS_INVALID("COMMON_400_PRICE_TIERS", HttpStatus.BAD_REQUEST, "error.common.price_tiers_invalid"),
    /** An endpoint whose business logic is not written yet. */
    NOT_IMPLEMENTED("COMMON_501", HttpStatus.NOT_IMPLEMENTED, "error.common.not_implemented");

    private final String code;
    private final HttpStatus httpStatus;
    private final String messageKey;
}
