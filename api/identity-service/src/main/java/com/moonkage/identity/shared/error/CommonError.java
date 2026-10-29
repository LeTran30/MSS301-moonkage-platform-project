package com.moonkage.identity.shared.error;

/** Errors of no module in particular ({@code COMMON_xxx}). */
public enum CommonError implements ErrorCode {
    INTERNAL_SERVER_ERROR("COMMON_500", 500, "error.common.internal"),
    INVALID_INPUT("COMMON_400", 400, "error.common.invalid_input"),
    ACCESS_DENIED("COMMON_403", 403, "error.common.access_denied"),
    MALFORMED_JSON("COMMON_400_JSON", 400, "error.common.malformed_json"),
    RESOURCE_NOT_FOUND("COMMON_404", 404, "error.common.resource_not_found"),
    METHOD_NOT_ALLOWED("COMMON_405", 405, "error.common.method_not_allowed");

    private final String code;
    private final int httpStatus;
    private final String messageKey;

    CommonError(String code, int httpStatus, String messageKey) {
        this.code = code;
        this.httpStatus = httpStatus;
        this.messageKey = messageKey;
    }

    @Override
    public String code() {
        return code;
    }

    @Override
    public int httpStatus() {
        return httpStatus;
    }

    @Override
    public String messageKey() {
        return messageKey;
    }
}
