package com.moonkage.identity.auth.infrastructure.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.application.Session;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.value.Text;

/** Answer of POST /login and /refresh-token. {@code phoneNumber} is the 9 subscriber digits, left out when none. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(
        String token,
        String refreshToken,
        String accountId,
        String email,
        String phoneNumber,
        String fullName,
        Role role) {

    static LoginResponse from(Session session) {
        AccountView account = session.account();
        return new LoginResponse(
                session.tokens().accessToken(),
                session.tokens().refreshToken(),
                account.id().toString(),
                account.email().value(),
                account.phoneNumber() == null ? null : account.phoneNumber().value(),
                session.fullName(),
                account.role());
    }

    @Override
    public String toString() {
        return "LoginResponse[token=" + Text.HIDDEN + ", refreshToken=" + Text.HIDDEN + ", accountId=" + accountId
                + ", email=" + email + ", phoneNumber=" + phoneNumber + ", fullName=" + fullName + ", role=" + role
                + "]";
    }
}
