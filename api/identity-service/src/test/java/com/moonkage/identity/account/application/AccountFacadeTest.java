package com.moonkage.identity.account.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.ErrorCode;
import com.moonkage.identity.shared.id.SequentialIdGenerator;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

/** The module as other modules use it: real use cases over an in-memory repository. */
class AccountFacadeTest {

    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00Z");
    private static final AccountId FIRST_ID = new AccountId(SequentialIdGenerator.nth(1));
    private static final Email EMAIL = Email.parse("lan@x.vn");
    private static final PhoneNumber PHONE = PhoneNumber.parse("0912345678");
    private static final RawPassword PASSWORD = RawPassword.parse("secret-123");
    private static final String UNKNOWN_ID = "0b7e4c19-2f5a-4d8e-a613-9c4d2e8f7a55";

    private final InMemoryAccountRepository accounts = new InMemoryAccountRepository();
    private final RecordingPasswordHasher hasher = new RecordingPasswordHasher();
    private final AccountApi api = new AccountFacade(
            new AccountQueries(accounts),
            new RegisterMember(accounts, hasher, new SequentialIdGenerator()),
            new ConfirmEmail(accounts),
            new ChangePassword(accounts, hasher, Clock.fixed(NOW, ZoneOffset.UTC)),
            new VerifyCredentials(accounts, hasher),
            accounts);

    @Test
    void newMemberGetsItsIdFromTheGeneratorAndIsUnconfirmed() {
        AccountView member = api.registerMember(EMAIL, PHONE, PASSWORD);

        assertEquals(new AccountView(FIRST_ID, EMAIL, PHONE, Role.MEMBER, false, null), member);
        assertEquals(member, api.find(FIRST_ID).orElseThrow());
        assertEquals(member, api.findByEmail(EMAIL).orElseThrow());
    }

    @Test
    void takenEmailOrPhoneIsRefusedBeforeAnythingIsWritten() {
        api.registerMember(EMAIL, PHONE, PASSWORD);

        assertError(AccountError.EMAIL_ALREADY_EXISTS, () -> api.registerMember(EMAIL, null, PASSWORD));
        assertError(
                AccountError.PHONE_ALREADY_EXISTS, () -> api.registerMember(Email.parse("mai@x.vn"), PHONE, PASSWORD));
        assertEquals(1, accounts.size());
    }

    @Test
    void parallelRegistrationsWithOneEmailLetExactlyOneThrough() throws Exception {
        int threads = 16;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Object>> results = new ArrayList<>();
            for (int i = 0; i < threads; i++) {
                results.add(pool.submit(() -> {
                    start.await();
                    try {
                        return api.registerMember(EMAIL, null, PASSWORD);
                    } catch (AppException e) {
                        return e.getErrorCode();
                    }
                }));
            }
            start.countDown();
            List<Object> outcomes = new ArrayList<>();
            for (Future<Object> result : results) {
                outcomes.add(result.get(10, TimeUnit.SECONDS));
            }

            // AC-01.3: every loser gets 409, whether the pre-check or the unique key stopped it
            assertEquals(
                    1, outcomes.stream().filter(AccountView.class::isInstance).count());
            assertEquals(
                    threads - 1,
                    outcomes.stream()
                            .filter(AccountError.EMAIL_ALREADY_EXISTS::equals)
                            .count());
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void confirmingTheEmailVerifiesTheAccount() {
        api.registerMember(EMAIL, null, PASSWORD);

        assertTrue(api.confirmEmail(FIRST_ID).verified());
        assertTrue(api.find(FIRST_ID).orElseThrow().verified());
    }

    @Test
    void passwordChangeEndsOlderTokens() {
        api.registerMember(EMAIL, null, PASSWORD);

        api.changePassword(FIRST_ID, RawPassword.parse("new-secret-1"));

        AccountView changed = api.find(FIRST_ID).orElseThrow();
        // the time comes from the Clock bean
        assertEquals(NOW, changed.passwordChangedAt());
        assertFalse(changed.acceptsTokenIssuedAt(NOW.minusSeconds(60)));
        assertTrue(changed.acceptsTokenIssuedAt(NOW));
    }

    @Test
    void unknownAccountAnswersNotFound() {
        AccountId unknown = AccountId.tryParse(UNKNOWN_ID).orElseThrow();

        assertError(AccountError.NOT_FOUND, () -> api.confirmEmail(unknown));
        assertError(AccountError.NOT_FOUND, () -> api.changePassword(unknown, PASSWORD));
        assertTrue(api.find(unknown).isEmpty());
    }

    private static void assertError(ErrorCode expected, Executable call) {
        assertEquals(expected, assertThrows(AppException.class, call).getErrorCode());
    }
}
