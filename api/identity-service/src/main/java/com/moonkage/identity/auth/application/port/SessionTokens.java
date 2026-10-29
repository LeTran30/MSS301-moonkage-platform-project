package com.moonkage.identity.auth.application.port;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.shared.value.Text;
import java.time.Instant;

/** The tokens a session runs on (FR-02): a short access token for each request, a long refresh token to renew it. */
public interface SessionTokens {

    /** A new pair for the account, issued now. */
    Pair issue(AccountView account);

    /**
     * Who a refresh token was issued to and when. Throws {@code REFRESH_TOKEN_INVALID} when it is not a valid,
     * unexpired refresh token of this service; an access token is refused too.
     */
    Claims readRefreshToken(String refreshToken);

    record Pair(String accessToken, String refreshToken) {

        @Override
        public String toString() {
            return "Pair[accessToken=" + Text.HIDDEN + ", refreshToken=" + Text.HIDDEN + "]";
        }
    }

    /**
     * What a valid token says about its holder.
     *
     * @param subject the account id as the token carries it; not checked to be a UUID
     * @param issuedAt compared with the last password change (Q-04)
     */
    record Claims(String subject, Instant issuedAt) {}
}
