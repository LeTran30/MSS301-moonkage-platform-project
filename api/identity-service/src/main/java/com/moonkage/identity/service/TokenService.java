package com.moonkage.identity.service;

import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.User;

public interface TokenService {

    String createToken(Account account, User user);

    String refreshToken(Account account);

    /** Parses an access token; refresh tokens are rejected. */
    Account getAccountFromToken(String token);

    /** Parses a refresh token; access tokens are rejected. */
    Account getAccountFromRefreshToken(String token);
}
