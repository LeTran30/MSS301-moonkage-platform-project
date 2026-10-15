package com.bake2b.identity.service;

import com.bake2b.identity.entity.Account;
import com.bake2b.identity.entity.User;

public interface TokenService {

    String createToken(Account account, User user);

    String refreshToken(Account account);

    /** Parses an access token; refresh tokens are rejected. */
    Account getAccountFromToken(String token);

    /** Parses a refresh token; access tokens are rejected. */
    Account getAccountFromRefreshToken(String token);
}
