package com.moonkage.identity.security;

import com.moonkage.identity.account.Role;

/** Injected into controllers via @CurrentUser; built once per request by JwtFilter. */
public record CurrentUserInfo(String accountId, String email, Role role) {}
