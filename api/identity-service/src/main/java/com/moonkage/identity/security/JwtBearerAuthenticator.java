package com.moonkage.identity.security;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.platform.security.BearerTokenAuthenticator;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Access tokens are JWTs this service issued, checked against the account as it is now. */
@Component
@RequiredArgsConstructor
class JwtBearerAuthenticator implements BearerTokenAuthenticator {

    private final JwtTokenProvider jwtTokenProvider;
    private final AccountApi accountApi;

    /** Throws AppException (token invalid / expired, account missing or not confirmed, token older than a reset). */
    @Override
    public CurrentUserInfo authenticate(String token) {
        JwtClaims claims = jwtTokenProvider.parseAccessToken(token);
        // loaded on every request: a still-valid token must not outlive a password reset or a deleted account.
        // A deleted account makes the token invalid (401), not a missing resource (404)
        AccountView account = AccountId.tryParse(claims.accountId())
                .flatMap(accountApi::find)
                .orElseThrow(() -> new AppException(LegacyError.TOKEN_INVALID));
        if (!account.verified()) {
            throw new AppException(LegacyError.ACCOUNT_NOT_ACTIVATED);
        }
        if (!account.acceptsTokenIssuedAt(claims.issuedAt())) {
            throw new AppException(LegacyError.TOKEN_INVALID);
        }
        return new CurrentUserInfo(account.id().toString(), account.email().value(), account.role());
    }
}
