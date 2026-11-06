package com.moonkage.identity.common.exception;

import com.moonkage.api.CommonErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INTERNAL_SERVER_ERROR(CommonErrorCode.INTERNAL_SERVER_ERROR),
    INVALID_INPUT(CommonErrorCode.INVALID_INPUT),
    ACCESS_DENIED(CommonErrorCode.ACCESS_DENIED),
    MALFORMED_JSON(CommonErrorCode.MALFORMED_JSON),
    RESOURCE_NOT_FOUND(CommonErrorCode.RESOURCE_NOT_FOUND),
    METHOD_NOT_ALLOWED(CommonErrorCode.METHOD_NOT_ALLOWED),

    // Auth
    INVALID_CREDENTIALS("AUTH_001", HttpStatus.UNAUTHORIZED, "error.auth.invalid_credentials"),
    ACCOUNT_NOT_ACTIVATED("AUTH_002", HttpStatus.FORBIDDEN, "error.auth.account_not_activated"),
    OTP_INVALID_OR_EXPIRED("AUTH_005", HttpStatus.BAD_REQUEST, "error.auth.otp_invalid_or_expired"),
    REFRESH_TOKEN_INVALID("AUTH_006", HttpStatus.UNAUTHORIZED, "error.auth.refresh_token_invalid"),
    EMAIL_ALREADY_EXISTS("AUTH_007", HttpStatus.CONFLICT, "error.auth.email_already_exists"),
    PHONE_ALREADY_EXISTS("AUTH_008", HttpStatus.CONFLICT, "error.auth.phone_already_exists"),
    MISSING_BEARER_TOKEN("AUTH_010", HttpStatus.UNAUTHORIZED, "error.auth.missing_bearer_token"),
    TOKEN_EXPIRED("AUTH_011", HttpStatus.UNAUTHORIZED, "error.auth.token_expired"),
    TOKEN_INVALID("AUTH_012", HttpStatus.UNAUTHORIZED, "error.auth.token_invalid"),
    EMAIL_DELIVERY_FAILED("AUTH_013", HttpStatus.SERVICE_UNAVAILABLE, "error.auth.email_delivery_failed"),
    OTP_TOO_FREQUENT("AUTH_014", HttpStatus.TOO_MANY_REQUESTS, "error.auth.otp_too_frequent"),
    OTP_MAX_ATTEMPTS_EXCEEDED("AUTH_015", HttpStatus.TOO_MANY_REQUESTS, "error.auth.otp_max_attempts_exceeded"),
    OTP_SEND_LIMIT_EXCEEDED("AUTH_016", HttpStatus.TOO_MANY_REQUESTS, "error.auth.otp_send_limit_exceeded"),

    // User & Address
    ACCOUNT_NOT_FOUND("USER_001", HttpStatus.NOT_FOUND, "error.user.account_not_found"),
    USER_PROFILE_NOT_FOUND("USER_002", HttpStatus.NOT_FOUND, "error.user.profile_not_found"),
    ADDRESS_NOT_FOUND("ADDRESS_001", HttpStatus.NOT_FOUND, "error.address.not_found"),

    // NFC verification (FR-04). Card rejections are not errors: they come back as SubmitCardResponse.
    NFC_ALREADY_VERIFIED("NFC_001", HttpStatus.CONFLICT, "error.nfc.already_verified"),
    NFC_LOCKED("NFC_002", HttpStatus.TOO_MANY_REQUESTS, "error.nfc.locked"),
    NFC_SESSION_EXPIRED("NFC_003", HttpStatus.GONE, "error.nfc.session_expired"),
    NFC_SESSION_NOT_OWNED("NFC_004", HttpStatus.FORBIDDEN, "error.nfc.session_not_owned"),
    ID_NUMBER_INVALID("NFC_005", HttpStatus.BAD_REQUEST, "error.nfc.id_number_invalid");

    private final String code;
    private final HttpStatus httpStatus;
    private final String messageKey;

    /**
     * A common code, taken from the shared list of common-api.
     *
     * <p>The code string, the status and the message key of the common failures exist in one place now, so they can no
     * longer drift apart between the services (audit findings H-02 and H-03).
     */
    ErrorCode(CommonErrorCode common) {
        this.code = common.getCode();
        this.httpStatus = common.getHttpStatus();
        this.messageKey = common.getMessageKey();
    }
}
