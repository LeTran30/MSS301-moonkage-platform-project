package com.moonkage.identity.auth.infrastructure.web;

import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.auth.application.Login;
import com.moonkage.identity.platform.web.validation.FieldParser;
import com.moonkage.identity.shared.value.Text;

/**
 * FR-02.
 *
 * @param username email or national phone number
 */
public record LoginRequest(String username, String password) {

    /**
     * Only presence is checked here: an identifier of the wrong shape is answered like an unknown one, and a password
     * is checked as it was set, without the policy of a new password.
     */
    Login.Command toCommand() {
        FieldParser parser = new FieldParser();
        String parsedUsername = parser.required("username", "validation.username", username, Text::required);
        RawPassword parsedPassword =
                parser.required("password", "validation.password", password, RawPassword::forLogin);
        parser.throwIfRejected();
        return new Login.Command(parsedUsername, parsedPassword);
    }

    @Override
    public String toString() {
        return "LoginRequest[username=" + username + ", password=" + Text.HIDDEN + "]";
    }
}
