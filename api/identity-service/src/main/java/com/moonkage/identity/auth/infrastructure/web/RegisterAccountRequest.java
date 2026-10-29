package com.moonkage.identity.auth.infrastructure.web;

import com.moonkage.identity.auth.application.RegisterAccount;
import com.moonkage.identity.platform.web.validation.FieldParser;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.value.Text;

/** AC-01.1: email, optional phone number, full name, password. No personal/business choice. */
public record RegisterAccountRequest(String email, String phoneNumber, String fullName, String password) {

    /** Every field parsed, or a 400 listing every bad one. A blank phone number means none. */
    RegisterAccount.Command toCommand() {
        FieldParser parser = new FieldParser();
        var parsedEmail = AuthFields.email(parser, email);
        var parsedPhoneNumber = parser.optional("phoneNumber", "validation.phone", phoneNumber, PhoneNumber::parse);
        var parsedFullName = parser.required("fullName", "validation.full_name", fullName, FullName::parse);
        var parsedPassword = AuthFields.newPassword(parser, "password", "validation.password", password);
        parser.throwIfRejected();
        return new RegisterAccount.Command(parsedEmail, parsedPhoneNumber, parsedFullName, parsedPassword);
    }

    @Override
    public String toString() {
        return "RegisterAccountRequest[email=" + email + ", phoneNumber=" + phoneNumber + ", fullName=" + fullName
                + ", password=" + Text.HIDDEN + "]";
    }
}
