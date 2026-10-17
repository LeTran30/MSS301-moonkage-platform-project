package com.moonkage.identity.exception;

/** SMTP refused or failed; the user should ask for the code again (FR-01). */
public class EmailDeliveryException extends CustomException {
    public EmailDeliveryException() {
        super("Không gửi được email chứa mã xác nhận. Vui lòng thử gửi lại mã.");
    }
}
