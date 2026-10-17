package com.moonkage.identity.exception;

public class InvalidCredentialsException extends CustomException {
    public InvalidCredentialsException() {
        super("Email/số điện thoại hoặc mật khẩu không đúng");
    }

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
