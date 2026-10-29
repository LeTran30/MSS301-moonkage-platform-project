package com.moonkage.identity.auth.infrastructure.token;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.auth.application.port.SessionTokens;
import com.moonkage.identity.platform.security.BearerTokenAuthenticator;
import com.moonkage.identity.platform.security.BearerTokenError;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Access tokens are JWTs this service issued, checked against the account as it is now. */
@Component
@RequiredArgsConstructor
class JwtBearerAuthenticator implements BearerTokenAuthenticator {

    private final JwtSessionTokens sessionTokens;
    private final AccountApi accountApi;

    /** Throws TOKEN_INVALID / TOKEN_EXPIRED, ACCOUNT_NOT_ACTIVATED, or TOKEN_INVALID for a token older than a reset. */
    @Override
    public CurrentUserInfo authenticate(String token) {
        SessionTokens.Claims claims = sessionTokens.readAccessToken(token);
        // loaded on every request: a still-valid token must not outlive a password reset or a deleted account.
        // A deleted account makes the token invalid (401), not a missing resource (404)
        AccountView account = AccountId.tryParse(claims.subject())
                .flatMap(accountApi::find)
                .orElseThrow(() -> new AppException(BearerTokenError.TOKEN_INVALID));
        if (!account.verified()) {
            throw new AppException(AuthError.ACCOUNT_NOT_ACTIVATED);
        }
        if (!account.acceptsTokenIssuedAt(claims.issuedAt())) {
            throw new AppException(BearerTokenError.TOKEN_INVALID);
        }
        return new CurrentUserInfo(account.id(), account.email(), account.role());
    }
}
