package com.moonkage.identity.contract;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import org.junit.jupiter.api.Test;

/** {@code /api/auth/**}: FR-01 register and confirm, FR-02 log in, keep the session, reset the password. */
class AuthContractTest extends ContractTest {

    // ───────── POST /api/auth/register ─────────

    @Test
    void registerCreatesAnUnconfirmedMemberAndMailsACode() throws Exception {
        String email = email("register-ok");

        Answer answer = register(email, "0910000001");

        assertContract("auth/register-ok", answer);
        Map<String, Object> row = jdbc.queryForMap(
                "SELECT a.phone_number, a.role, a.account_verified, a.password_changed_at, p.full_name "
                        + "FROM accounts a JOIN user_profiles p ON p.account_id = a.id WHERE a.email = ?",
                email);
        assertEquals("910000001", row.get("phone_number"));
        assertEquals("MEMBER", row.get("role"));
        assertEquals(false, row.get("account_verified"));
        assertNull(row.get("password_changed_at"));
        assertEquals("Nguyen Lan", row.get("full_name"));
        assertEquals(accountIdOf(email), answer.read("$.data.id"));
        Golden.assertEvent(
                "auth/register-ok-mail",
                inbox().awaitLast(
                                e -> EMAIL_ROUTING_KEY.equals(e.routingKey())
                                        && e.body().contains(email),
                                "registration mail"));
    }

    @Test
    void registerStoresEmailInLowerCaseAndEmptyPhoneAsNone() throws Exception {
        String body = """
                {"email":"  Register-Case@Contract.VN ","phoneNumber":"","fullName":"  Nguyen Lan ",
                "password":"%s"}""".formatted(PASSWORD);
        Answer answer = postJson("/api/auth/register", body);

        assertContract("auth/register-normalized", answer);
        Map<String, Object> row = jdbc.queryForMap(
                "SELECT a.phone_number, p.full_name FROM accounts a JOIN user_profiles p ON p.account_id = a.id "
                        + "WHERE a.email = ?",
                email("register-case"));
        assertNull(row.get("phone_number"));
        assertEquals("Nguyen Lan", row.get("full_name"));
    }

    @Test
    void registerReportsEveryInvalidField() throws Exception {
        String tooLongName = "x".repeat(101);
        String body = """
                {"email":"not-an-email","phoneNumber":"12345",
                "fullName":"%s","password":"short"}""".formatted(tooLongName);
        assertContract("auth/register-invalid", postJson("/api/auth/register", body));
    }

    @Test
    void registerReportsEveryMissingField() throws Exception {
        assertContract("auth/register-missing", postJson("/api/auth/register", "{}"));
    }

    @Test
    void registerRefusesAPasswordLongerThan72() throws Exception {
        assertContract("auth/register-password-too-long", postJson("/api/auth/register", """
                {"email":"%s","fullName":"Nguyen Lan","password":"%s"}""".formatted(
                        email("register-long-password"), "a".repeat(73))));
    }

    @Test
    void registerRefusesATakenEmailOrPhone() throws Exception {
        register(email("register-taken"), "0910000002");

        assertContract("auth/register-email-taken", register(email("register-taken"), "0910000003"));
        assertContract("auth/register-phone-taken", register(email("register-taken-2"), "0910000002"));
    }

    @Test
    void registerTakesTheNationalFormOnly() throws Exception {
        // decision C1: 0 then 9 digits; +84, 84 and the bare 9 digits are refused
        for (String phone : new String[] {"+84910000004", "84910000004", "910000004"}) {
            assertContract("auth/register-phone-not-national", register(email("register-intl"), phone));
        }
    }

    @Test
    void malformedJsonIsItsOwnError() throws Exception {
        assertContract("auth/malformed-json", postJson("/api/auth/register", "{\"email\":"));
    }

    // ───────── POST /api/auth/verify-account ─────────

    @Test
    void verifyAccountConfirmsTheEmailOnce() throws Exception {
        String email = email("verify-ok");
        register(email, null);
        String otp = lastOtp(email, REGISTRATION);

        assertContract("auth/verify-ok", postJson("/api/auth/verify-account", """
                {"email":"%s","otp":"%s"}""".formatted(email, otp)));
        assertEquals(
                true,
                jdbc.queryForObject("SELECT account_verified FROM accounts WHERE email = ?", Boolean.class, email));
        // the code is used up
        assertContract("auth/verify-used-code", postJson("/api/auth/verify-account", """
                {"email":"%s","otp":"%s"}""".formatted(email, otp)));
    }

    @Test
    void wrongCodeAndUnknownEmailGetTheSameAnswer() throws Exception {
        String email = email("verify-wrong");
        register(email, null);
        String wrong = wrongCode(lastOtp(email, REGISTRATION));

        Answer wrongCode = postJson("/api/auth/verify-account", """
                {"email":"%s","otp":"%s"}""".formatted(email, wrong));
        Answer unknownEmail = postJson("/api/auth/verify-account", """
                {"email":"%s","otp":"123456"}""".formatted(email("verify-nobody")));

        assertContract("auth/verify-wrong-code", wrongCode);
        assertContract("auth/verify-wrong-code", unknownEmail);
    }

    @Test
    void fifthWrongCodeLocksTheEmail() throws Exception {
        String email = email("verify-lock");
        register(email, null);
        String otp = lastOtp(email, REGISTRATION);
        String wrong = wrongCode(otp);
        for (int i = 0; i < 4; i++) {
            assertEquals(
                    400,
                    postJson("/api/auth/verify-account", """
                    {"email":"%s","otp":"%s"}""".formatted(email, wrong))
                            .status());
        }

        assertContract("auth/verify-locked", postJson("/api/auth/verify-account", """
                {"email":"%s","otp":"%s"}""".formatted(email, wrong)));
        // even the right code is refused while locked
        assertContract(
                "auth/verify-locked-right-code", postJson("/api/auth/verify-account", """
                {"email":"%s","otp":"%s"}""".formatted(email, otp)));
    }

    @Test
    void verifyAccountReportsEveryInvalidField() throws Exception {
        assertContract("auth/verify-missing", postJson("/api/auth/verify-account", "{}"));
        assertContract("auth/verify-invalid-email", postJson("/api/auth/verify-account", """
                {"email":"nope","otp":"123456"}"""));
    }

    // ───────── POST /api/auth/send-verify-account-otp ─────────

    @Test
    void resendGivesANewCodeOnlyAfterTheCooldown() throws Exception {
        String email = email("resend");
        register(email, null);

        // the registration mail just went out: the cooldown is running
        assertContract("auth/resend-too-soon", postJson("/api/auth/send-verify-account-otp", """
                {"email":"%s"}""".formatted(email)));
    }

    @Test
    void resendSendsNothingToUnknownOrConfirmedEmails() throws Exception {
        String confirmed = activeAccount("resend-confirmed");

        Answer unknown = postJson("/api/auth/send-verify-account-otp", """
                {"email":"%s"}""".formatted(email("resend-nobody")));
        Answer done = postJson("/api/auth/send-verify-account-otp", """
                {"email":"%s"}""".formatted(confirmed));

        assertContract("auth/resend-unknown", unknown);
        // the registration mail of a moment ago still holds the cooldown, confirmed or not
        assertContract("auth/resend-confirmed-in-cooldown", done);
        assertTrue(inbox().all(e -> e.body().contains(email("resend-nobody"))).isEmpty(), "no mail to a stranger");
    }

    @Test
    void resendValidatesTheEmail() throws Exception {
        assertContract("auth/resend-missing", postJson("/api/auth/send-verify-account-otp", "{}"));
        assertContract("auth/resend-invalid", postJson("/api/auth/send-verify-account-otp", "{\"email\":\"x\"}"));
    }

    // ───────── POST /api/auth/login ─────────

    @Test
    void loginByEmailOrNationalPhone() throws Exception {
        String email = activeAccount("login-ok", "0910000010");

        assertContract("auth/login-ok", login(email, PASSWORD));
        Answer byPhone = login("0910000010", PASSWORD);
        assertEquals(200, byPhone.status());
        assertEquals(email, byPhone.read("$.data.email"));
        // decision C1: other forms of the same number are unknown logins
        for (String phone : new String[] {"+84910000010", "84910000010", "910000010"}) {
            assertContract("auth/login-rejected", login(phone, PASSWORD));
        }
        assertContract("auth/login-ok", login(email.toUpperCase(), PASSWORD));
    }

    @Test
    void wrongPasswordAndUnknownUserGetTheSameAnswer() throws Exception {
        String email = activeAccount("login-wrong");

        assertContract("auth/login-rejected", login(email, "Wrong@999"));
        assertContract("auth/login-rejected", login(email("login-nobody"), PASSWORD));
        assertContract("auth/login-rejected", login("0999999999", PASSWORD));
    }

    @Test
    void unconfirmedAccountIsToldSoOnlyWithTheRightPassword() throws Exception {
        String email = email("login-unconfirmed");
        register(email, null);

        assertContract("auth/login-not-activated", login(email, PASSWORD));
        assertContract("auth/login-rejected", login(email, "Wrong@999"));
    }

    @Test
    void loginReportsEveryMissingField() throws Exception {
        assertContract("auth/login-missing", postJson("/api/auth/login", "{}"));
    }

    // ───────── POST /api/auth/refresh-token ─────────

    @Test
    void refreshTokenOpensANewSession() throws Exception {
        String email = activeAccount("refresh-ok");
        String refreshToken = login(email, PASSWORD).read("$.data.refreshToken");

        assertContract("auth/refresh-ok", postJson("/api/auth/refresh-token", """
                {"refreshToken":"%s"}""".formatted(refreshToken)));
    }

    @Test
    void anythingButARefreshTokenIsRefused() throws Exception {
        String email = activeAccount("refresh-wrong");
        String accessToken = accessToken(email);

        assertContract("auth/refresh-invalid", postJson("/api/auth/refresh-token", """
                {"refreshToken":"not-a-token"}"""));
        assertContract("auth/refresh-invalid", postJson("/api/auth/refresh-token", """
                {"refreshToken":"%s"}""".formatted(accessToken)));
        assertContract("auth/refresh-missing", postJson("/api/auth/refresh-token", "{}"));
    }

    // ───────── reset password ─────────

    @Test
    void resetPasswordEndsEveryEarlierSession() throws Exception {
        String email = activeAccount("reset-ok");
        Answer before = login(email, PASSWORD);
        String oldAccess = before.read("$.data.token");
        String oldRefresh = before.read("$.data.refreshToken");
        // Q-04 compares whole seconds: the reset must happen in a later second than the old tokens
        Thread.sleep(1100);

        assertContract("auth/reset-send-ok", postJson("/api/auth/send-reset-password-otp", """
                {"email":"%s"}""".formatted(email)));
        Golden.assertEvent(
                "auth/reset-mail",
                inbox().awaitLast(
                                e -> EMAIL_ROUTING_KEY.equals(e.routingKey())
                                        && e.body().contains(email)
                                        && e.body().contains(FORGOT_PASSWORD),
                                "reset mail"));
        assertContract("auth/reset-ok", postJson("/api/auth/reset-password", """
                {"email":"%s","otp":"%s","newPassword":"%s"}""".formatted(
                        email, lastOtp(email, FORGOT_PASSWORD), NEW_PASSWORD)));

        assertNotEquals(
                null,
                jdbc.queryForObject("SELECT password_changed_at FROM accounts WHERE email = ?", Object.class, email));
        assertContract("auth/login-rejected", login(email, PASSWORD));
        assertEquals(200, login(email, NEW_PASSWORD).status());
        assertContract("auth/refresh-invalid", postJson("/api/auth/refresh-token", """
                {"refreshToken":"%s"}""".formatted(oldRefresh)));
        assertContract("security/token-invalid-me", getWith("/api/accounts/me", oldAccess));
    }

    @Test
    void registrationCodeCannotResetThePassword() throws Exception {
        String email = email("reset-wrong-purpose");
        register(email, null);
        String registrationCode = lastOtp(email, REGISTRATION);
        jdbc.update("UPDATE accounts SET account_verified = true WHERE email = ?", email);

        assertContract("auth/reset-wrong-code", postJson("/api/auth/reset-password", """
                {"email":"%s","otp":"%s","newPassword":"%s"}""".formatted(
                        email, registrationCode, NEW_PASSWORD)));
    }

    @Test
    void resetCodeGoesOnlyToConfirmedAccountsButAnswersAlike() throws Exception {
        String unconfirmed = email("reset-unconfirmed");
        register(unconfirmed, null);

        assertContract("auth/reset-send-ok", postJson("/api/auth/send-reset-password-otp", """
                {"email":"%s"}""".formatted(unconfirmed)));
        assertContract("auth/reset-send-ok", postJson("/api/auth/send-reset-password-otp", """
                {"email":"%s"}""".formatted(
                        email("reset-nobody"))));
        assertTrue(inbox().all(e -> e.body().contains(unconfirmed) && e.body().contains(FORGOT_PASSWORD))
                .isEmpty());
    }

    @Test
    void resetSendIsThrottledLikeEveryOtherSend() throws Exception {
        String email = activeAccount("reset-throttle");
        postJson("/api/auth/send-reset-password-otp", "{\"email\":\"%s\"}".formatted(email));

        assertContract("auth/reset-send-too-soon", postJson("/api/auth/send-reset-password-otp", """
                {"email":"%s"}""".formatted(email)));
    }

    @Test
    void resetReportsEveryInvalidField() throws Exception {
        assertContract("auth/reset-missing", postJson("/api/auth/reset-password", "{}"));
        assertContract("auth/reset-invalid", postJson("/api/auth/reset-password", """
                {"email":"nope","otp":"","newPassword":"short"}"""));
        assertContract("auth/reset-send-missing", postJson("/api/auth/send-reset-password-otp", "{}"));
    }

    private static String wrongCode(String otp) {
        return otp.equals("000000") ? "111111" : "000000";
    }
}
