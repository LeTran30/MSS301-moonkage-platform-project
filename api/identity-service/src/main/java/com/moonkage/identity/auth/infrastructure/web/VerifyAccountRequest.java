package com.moonkage.identity.auth.infrastructure.web;

import com.moonkage.identity.auth.application.VerifyAccount;
import com.moonkage.identity.platform.web.validation.FieldParser;
import com.moonkage.identity.shared.value.Text;

public record VerifyAccountRequest(String email, String otp) {

    VerifyAccount.Command toCommand() {
        FieldParser parser = new FieldParser();
        var parsedEmail = AuthFields.email(parser, email);
        var parsedCode = AuthFields.otpCode(parser, otp);
        parser.throwIfRejected();
        return new VerifyAccount.Command(parsedEmail, parsedCode);
    }

    @Override
    public String toString() {
        return "VerifyAccountRequest[email=" + email + ", otp=" + Text.HIDDEN + "]";
    }
}
