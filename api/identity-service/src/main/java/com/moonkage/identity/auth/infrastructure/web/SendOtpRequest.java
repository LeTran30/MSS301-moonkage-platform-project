package com.moonkage.identity.auth.infrastructure.web;

import com.moonkage.identity.platform.web.validation.FieldParser;
import com.moonkage.identity.shared.Email;

/** Body that only carries an email: send-verify-account-otp and send-reset-password-otp. */
public record SendOtpRequest(String email) {

    Email toEmail() {
        FieldParser parser = new FieldParser();
        Email parsedEmail = AuthFields.email(parser, email);
        parser.throwIfRejected();
        return parsedEmail;
    }
}
