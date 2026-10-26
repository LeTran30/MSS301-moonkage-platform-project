package com.moonkage.identity.security;

import java.time.Instant;

/** What a valid token tells about its holder: the account ({@code sub}) and when it was issued ({@code iat}). */
public record JwtClaims(String accountId, Instant issuedAt) {}
