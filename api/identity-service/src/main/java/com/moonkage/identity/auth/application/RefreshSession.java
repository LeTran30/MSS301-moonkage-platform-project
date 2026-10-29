package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.auth.application.port.SessionTokens;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** FR-02: a refresh token opens a new session, checked against the account as it is now. */
@Service
@RequiredArgsConstructor
public class RefreshSession {

    private final SessionTokens sessionTokens;
    private final AccountApi accountApi;
    private final SessionOpener sessionOpener;

    /** Throws REFRESH_TOKEN_INVALID (bad token, account gone, password changed since), or ACCOUNT_NOT_ACTIVATED. */
    public Session handle(String refreshToken) {
        SessionTokens.Claims claims = sessionTokens.readRefreshToken(refreshToken);
        AccountView account = AccountId.tryParse(claims.subject())
                .flatMap(accountApi::find)
                .orElseThrow(() -> new AppException(AuthError.REFRESH_TOKEN_INVALID));
        if (!account.verified()) {
            throw new AppException(AuthError.ACCOUNT_NOT_ACTIVATED);
        }
        // a refresh token from before a password reset must not open a new session (Q-04)
        if (!account.acceptsTokenIssuedAt(claims.issuedAt())) {
            throw new AppException(AuthError.REFRESH_TOKEN_INVALID);
        }
        return sessionOpener.open(account);
    }
}
