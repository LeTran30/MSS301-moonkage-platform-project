package com.moonkage.identity.service;

import com.moonkage.identity.entity.Account;

public interface TokenService {

    String createToken(Account account);

    String refreshToken(Account account);

    /** Parses an access token; refresh tokens are rejected. */
    Account getAccountFromToken(String token);

    /** Parses a refresh token; access tokens are rejected. */
    Account getAccountFromRefreshToken(String token);
}
