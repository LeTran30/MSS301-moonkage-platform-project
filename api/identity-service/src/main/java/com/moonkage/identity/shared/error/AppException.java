package com.moonkage.identity.shared.error;

/** A business rule refused the request (plan v2, 5.4): answered with the status of its {@link ErrorCode}. */
public class AppException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    @SuppressWarnings("serial")
    private final ErrorCode errorCode;

    @SuppressWarnings("serial")
    private final Object[] args;

    /** @param args message arguments, in the order of the message's {@code {0}, {1}…} */
    public AppException(ErrorCode errorCode, Object... args) {
        super(errorCode.messageKey());
        this.errorCode = errorCode;
        this.args = args.clone();
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public Object[] getArgs() {
        return args.clone();
    }
}
