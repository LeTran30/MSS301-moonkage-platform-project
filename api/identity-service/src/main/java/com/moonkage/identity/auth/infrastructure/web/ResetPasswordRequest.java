package com.moonkage.identity.auth.infrastructure.web;

import com.moonkage.identity.auth.application.ResetPassword;
import com.moonkage.identity.platform.web.validation.FieldParser;
import com.moonkage.identity.shared.value.Text;

public record ResetPasswordRequest(String email, String otp, String newPassword) {

    ResetPassword.Command toCommand() {
        FieldParser parser = new FieldParser();
        var parsedEmail = AuthFields.email(parser, email);
        var parsedCode = AuthFields.otpCode(parser, otp);
        var parsedPassword = AuthFields.newPassword(parser, "newPassword", "validation.new_password", newPassword);
        parser.throwIfRejected();
        return new ResetPassword.Command(parsedEmail, parsedCode, parsedPassword);
    }

    @Override
    public String toString() {
        return "ResetPasswordRequest[email=" + email + ", otp=" + Text.HIDDEN + ", newPassword=" + Text.HIDDEN + "]";
    }
}
