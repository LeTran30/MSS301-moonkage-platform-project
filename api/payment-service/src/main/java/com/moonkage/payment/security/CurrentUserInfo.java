package com.moonkage.payment.security;

/** The caller of a request, injected into controllers via @CurrentUser from the gateway headers. */
public record CurrentUserInfo(String accountId, Role role) {

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
