package com.moonkage.identity.contract;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** Bearer token handling shared by every protected endpoint, {@code GET /api/accounts/me}, and generic errors. */
class AccessContractTest extends ContractTest {

    // ───────── GET /api/accounts/me ─────────

    @Test
    void meShowsTheAccountWithItsProfileName() throws Exception {
        String email = activeAccount("me-ok", "0910000020");

        assertContract("account/me-ok", getWith("/api/accounts/me", accessToken(email)));
    }

    @Test
    void accountWithoutProfileIsReported() throws Exception {
        String email = activeAccount("me-no-profile");
        String token = accessToken(email);
        jdbc.update("DELETE FROM profiles WHERE account_id = ?", accountIdOf(email));

        assertContract("account/me-no-profile", getWith("/api/accounts/me", token));
    }

    // ───────── bearer token ─────────

    @Test
    void missingTokenIsReportedWithThePath() throws Exception {
        assertContract("security/token-missing", call(get("/api/accounts/me")));
        assertContract("security/token-missing-addresses", call(get("/api/accounts/me/addresses")));
    }

    @Test
    void tokenThatIsNoTokenIsInvalid() throws Exception {
        assertContract("security/token-invalid-me", getWith("/api/accounts/me", "not-a-token"));
    }

    @Test
    void refreshTokenDoesNotOpenProtectedEndpoints() throws Exception {
        String email = activeAccount("token-refresh-as-access");
        String refreshToken = login(email, PASSWORD).read("$.data.refreshToken");

        assertContract("security/token-invalid-me", getWith("/api/accounts/me", refreshToken));
    }

    @Test
    void expiredTokenIsReportedAsExpired() throws Exception {
        String accountId = accountIdOf(activeAccount("token-expired"));
        Instant past = Instant.now().minus(Duration.ofHours(2));

        assertContract(
                "security/token-expired",
                getWith("/api/accounts/me", craftedAccessToken(accountId, past, past.plus(Duration.ofHours(1)))));
    }

    @Test
    void tokenOfAGoneAccountIsInvalid() throws Exception {
        Instant now = Instant.now();

        assertContract(
                "security/token-invalid-me",
                getWith(
                        "/api/accounts/me",
                        craftedAccessToken(UUID.randomUUID().toString(), now, now.plus(Duration.ofHours(1)))));
    }

    @Test
    void tokenOfAnUnconfirmedAccountIsRefused() throws Exception {
        String email = email("token-unconfirmed");
        register(email, null);
        Instant now = Instant.now();

        assertContract(
                "security/token-not-activated",
                getWith(
                        "/api/accounts/me",
                        craftedAccessToken(accountIdOf(email), now, now.plus(Duration.ofHours(1)))));
    }

    // ───────── generic errors ─────────

    @Test
    void unknownPathIsNotFound() throws Exception {
        assertContract("common/not-found", getWith("/api/nothing-here", accessToken(activeAccount("common-404"))));
    }

    @Test
    void wrongMethodIsNotAllowed() throws Exception {
        assertContract("common/method-not-allowed", call(delete("/api/auth/login")));
    }
}
