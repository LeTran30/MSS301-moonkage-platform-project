package com.moonkage.identity.security;

import lombok.Data;

/** Injected into controllers via @CurrentUser. */
@Data
public class CurrentUserInfo {
    private String accountId;
    private String userId;
    private String email;
    private String role;
}
