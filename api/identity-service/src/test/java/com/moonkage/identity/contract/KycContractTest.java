package com.moonkage.identity.contract;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** FR-04 identity check by NFC: {@code /api/nfc/**}, {@code /internal/**} and the {@code account.kyc_*} events. */
class KycContractTest extends ContractTest {

    private static final String BAD_CARD = "{\"fullName\":\"NGUYEN VAN AN\",\"encryptedFields\":\"not-a-jwe\"}";

    // ───────── sessions ─────────

    @Test
    void sessionIsCreatedAndReadableByItsOwnerOnly() throws Exception {
        String owner = accessToken(activeAccount("nfc-session"));
        String stranger = accessToken(activeAccount("nfc-session-stranger"));

        Answer created = call(post("/api/nfc/sessions").header("Authorization", bearer(owner)));
        assertContract("kyc/session-created", created);
        String sessionId = created.read("$.data.sessionId");

        assertContract("kyc/session-pending", getWith("/api/nfc/sessions/" + sessionId, owner));
        assertContract("kyc/session-not-owned", getWith("/api/nfc/sessions/" + sessionId, stranger));
        assertContract("kyc/session-unknown", getWith("/api/nfc/sessions/" + UUID.randomUUID(), owner));
        assertContract("kyc/card-session-not-owned", submitCard(stranger, sessionId, validCard("079190000001")));
        assertContract(
                "kyc/card-session-unknown", submitCard(owner, UUID.randomUUID().toString(), BAD_CARD));
    }

    // ───────── cards ─────────

    @Test
    void verifiedCardCompletesTheCheck() throws Exception {
        String email = activeAccount("nfc-verified");
        String token = accessToken(email);
        String accountId = accountIdOf(email);
        String sessionId = createNfcSession(token);

        assertContract("kyc/status-not-verified", getWith("/api/nfc/status", token));
        assertContract("kyc/card-verified", submitCard(token, sessionId, validCard("079190000002")));
        Golden.assertEvent(
                "kyc/event-verified",
                inbox().awaitLast(
                                e -> "account.kyc_verified".equals(e.routingKey())
                                        && e.body().contains(accountId),
                                "kyc_verified"));

        assertContract("kyc/session-verified", getWith("/api/nfc/sessions/" + sessionId, token));
        assertContract("kyc/card-session-used", submitCard(token, sessionId, validCard("079190000002")));
        assertContract("kyc/status-verified", getWith("/api/nfc/status", token));
        assertContract(
                "kyc/session-already-verified", call(post("/api/nfc/sessions").header("Authorization", bearer(token))));
    }

    @Test
    void rejectedCardsCountTowardsALockout() throws Exception {
        String email = activeAccount("nfc-lockout");
        String token = accessToken(email);
        String accountId = accountIdOf(email);

        assertContract("kyc/card-bad-format", submitCard(token, createNfcSession(token), BAD_CARD));
        Golden.assertEvent(
                "kyc/event-failed",
                inbox().awaitLast(
                                e -> "account.kyc_failed".equals(e.routingKey())
                                        && e.body().contains(accountId),
                                "kyc_failed"));
        assertContract(
                "kyc/card-expired",
                submitCard(token, createNfcSession(token), cardBody("079190000003", LocalDate.of(2020, 1, 1))));
        for (int i = 0; i < 2; i++) {
            submitCard(token, createNfcSession(token), BAD_CARD);
        }

        assertContract("kyc/card-locked", submitCard(token, createNfcSession(token), BAD_CARD));
        Golden.assertEvent(
                "kyc/event-locked",
                inbox().awaitLast(
                                e -> "account.kyc_locked".equals(e.routingKey())
                                        && e.body().contains(accountId),
                                "kyc_locked"));
        assertContract("kyc/session-locked", call(post("/api/nfc/sessions").header("Authorization", bearer(token))));
        assertContract("kyc/status-locked", getWith("/api/nfc/status", token));
    }

    @Test
    void cardLinkedToAnotherAccountIsRefused() throws Exception {
        verifiedAccount("nfc-first-owner", "079190000004");
        String token = accessToken(activeAccount("nfc-second-owner"));

        assertContract(
                "kyc/card-already-linked", submitCard(token, createNfcSession(token), validCard("079190000004")));
    }

    // ───────── /internal/** (vendor-service, quotation-service) ─────────

    @Test
    void internalStatusIsUnwrapped() throws Exception {
        String verified = verifiedAccount("internal-status-verified", "079190000005");
        String waiting = activeAccount("internal-status-waiting");

        assertContract("internal/status-verified", call(get("/internal/nfc/status/" + accountIdOf(verified))));
        assertContract("internal/status-not-verified", call(get("/internal/nfc/status/" + accountIdOf(waiting))));
        assertContract("internal/status-unknown", call(get("/internal/nfc/status/" + UUID.randomUUID())));
        assertContract("internal/status-unknown-not-uuid", call(get("/internal/nfc/status/not-a-uuid")));
    }

    @Test
    void internalCheckComparesTheDeclaredNumberWithTheVerifiedCard() throws Exception {
        String owner = accountIdOf(verifiedAccount("internal-check-owner", "079190000006"));
        String waiting = accountIdOf(activeAccount("internal-check-waiting"));

        assertContract("internal/check-match", check(owner, "079190000006"));
        assertContract("internal/check-match", check(owner, " 0791 9000 0006 "));
        assertContract("internal/check-other-number", check(owner, "079190000007"));
        // no verified card: kycVerified is false; nfcVerifiedAt is null for every account since G1
        assertContract("internal/check-not-verified", check(waiting, "079190000006"));
    }

    @Test
    void internalCheckRefusesBadInput() throws Exception {
        String waiting = accountIdOf(activeAccount("internal-check-bad"));

        assertContract("internal/check-invalid-number", check(waiting, "12345"));
        assertContract("internal/check-unknown-account", check(UUID.randomUUID().toString(), "079190000008"));
        assertContract("internal/check-missing", postJson("/internal/accounts/check", "{}"));
    }

    @Test
    void idHashIsStableForAGivenPepper() throws Exception {
        String owner = accountIdOf(verifiedAccount("internal-check-hash", "079190000009"));

        // vendor-service stores this hash: it must not change while the pepper does not
        String first = check(owner, "079190000009").read("$.idHash");
        assertEquals(first, check(owner, "079190000009").read("$.idHash"));
        assertContract("internal/check-hash", check(owner, "079190000009"));
    }

    private Answer check(String accountId, String idNumber) throws Exception {
        return postJson("/internal/accounts/check", """
                {"accountId":"%s","idNumber":"%s"}""".formatted(accountId, idNumber));
    }
}
