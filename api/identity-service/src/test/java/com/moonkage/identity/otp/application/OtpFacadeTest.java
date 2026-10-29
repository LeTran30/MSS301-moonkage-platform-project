package com.moonkage.identity.otp.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.otp.OtpApi;
import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpError;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.otp.application.port.OtpStore;
import com.moonkage.identity.otp.domain.OtpEntry;
import com.moonkage.identity.otp.domain.OtpKey;
import com.moonkage.identity.otp.domain.OtpRules;
import com.moonkage.identity.platform.config.MovableClock;
import com.moonkage.identity.platform.memory.ExpiringMap;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.ErrorCode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.UnaryOperator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

/** The otp module as auth uses it: real use cases and rules over an in-memory store, with a clock moved by hand. */
class OtpFacadeTest {

    private static final Email EMAIL = Email.parse("a@x.vn");
    private static final OtpPurpose PURPOSE = OtpPurpose.VERIFY_ACCOUNT;
    private static final OtpCode WRONG = new OtpCode("000000");
    private static final Duration COOLDOWN = Duration.ofSeconds(60);
    private static final Duration CODE_LIFETIME = Duration.ofMinutes(5);
    private static final Duration LOCKOUT = Duration.ofMinutes(15);
    private static final int MAX_ATTEMPTS = 3;
    private static final int MAX_SENDS = 5;

    private final MovableClock clock = new MovableClock(Instant.parse("2026-10-29T08:00:00Z"));
    private final OtpRules rules = new OtpRules(CODE_LIFETIME, MAX_ATTEMPTS, COOLDOWN, MAX_SENDS, LOCKOUT);
    private final MapOtpStore store = new MapOtpStore();
    private final OtpApi otp = new OtpFacade(
            new IssueOtp(store, rules, clock),
            new ThrottleOtpSend(store, rules, clock),
            new VerifyOtp(store, rules, clock),
            new DiscardOtp(store, rules),
            rules);

    @Test
    void issuedCodeIsSixDigitsAndAcceptedOnce() {
        OtpCode code = otp.issue(PURPOSE, EMAIL);

        assertTrue(code.value().matches("[1-9]\\d{5}"), code::value);
        assertTrue(accepts(PURPOSE, code));
        // consumed: a second use is a wrong guess
        assertFalse(accepts(PURPOSE, code));
    }

    @Test
    void secondSendInsideTheCooldownIsTooFrequent() {
        otp.issue(PURPOSE, EMAIL);
        clock.advance(Duration.ofSeconds(20));

        AppException error = assertThrows(AppException.class, () -> otp.issue(PURPOSE, EMAIL));

        assertEquals(OtpError.TOO_FREQUENT, error.getErrorCode());
        // seconds left of the cooldown, for the message
        assertEquals(40L, error.getArgs()[0]);
    }

    @Test
    void resendWhileTheCodeIsValidGivesTheSameCodeAndKeepsTheWrongGuesses() {
        OtpCode first = otp.issue(PURPOSE, EMAIL);
        assertFalse(accepts(PURPOSE, WRONG));
        clock.advance(COOLDOWN);

        assertEquals(first, otp.issue(PURPOSE, EMAIL));
        assertEquals(1, entry(PURPOSE).attempts());
    }

    @Test
    void resendAfterTheCodeExpiredGivesANewCode() {
        OtpCode first = otp.issue(PURPOSE, EMAIL);
        clock.advance(CODE_LIFETIME);

        assertFalse(accepts(PURPOSE, first));
        OtpCode second = otp.issue(PURPOSE, EMAIL);
        assertTrue(accepts(PURPOSE, second));
    }

    @Test
    void sendsAboveTheHourlyQuotaAreRefusedUntilTheHourIsOver() {
        for (int i = 0; i < MAX_SENDS; i++) {
            otp.issue(PURPOSE, EMAIL);
            clock.advance(COOLDOWN);
        }

        assertError(OtpError.SEND_LIMIT_EXCEEDED, () -> otp.issue(PURPOSE, EMAIL));

        clock.advance(OtpRules.SEND_WINDOW);
        assertNotNull(otp.issue(PURPOSE, EMAIL));
    }

    @Test
    void tooManyWrongGuessesLockOutSendingAndGuessing() {
        OtpCode code = otp.issue(PURPOSE, EMAIL);
        assertFalse(accepts(PURPOSE, WRONG));
        assertFalse(accepts(PURPOSE, WRONG));

        AppException lockout = assertThrows(AppException.class, () -> otp.verify(PURPOSE, EMAIL, WRONG));
        assertEquals(OtpError.MAX_ATTEMPTS_EXCEEDED, lockout.getErrorCode());
        // allowed guesses and minutes left, for the message
        assertEquals(MAX_ATTEMPTS, lockout.getArgs()[0]);
        assertEquals(LOCKOUT.toMinutes() + 1, lockout.getArgs()[1]);

        clock.advance(COOLDOWN);
        assertError(OtpError.MAX_ATTEMPTS_EXCEEDED, () -> otp.issue(PURPOSE, EMAIL));
        // even the right code is refused while locked out
        assertError(OtpError.MAX_ATTEMPTS_EXCEEDED, () -> otp.verify(PURPOSE, EMAIL, code));
    }

    @Test
    void finishedLockoutStartsAFreshRoundOfAttempts() {
        otp.issue(PURPOSE, EMAIL);
        lockOut(PURPOSE);
        clock.advance(LOCKOUT);

        assertFalse(accepts(PURPOSE, WRONG));
        assertEquals(1, entry(PURPOSE).attempts());
    }

    @Test
    void discardedCodeNoLongerWorks() {
        OtpCode code = otp.issue(PURPOSE, EMAIL);

        otp.discard(PURPOSE, EMAIL);

        assertFalse(accepts(PURPOSE, code));
    }

    @Test
    void discardKeepsTheLockout() {
        otp.issue(PURPOSE, EMAIL);
        lockOut(PURPOSE);

        otp.discard(PURPOSE, EMAIL);
        clock.advance(COOLDOWN);

        assertError(OtpError.MAX_ATTEMPTS_EXCEEDED, () -> otp.issue(PURPOSE, EMAIL));
    }

    // ───────── an email without an account answers like one with (FR-02) ─────────

    @Test
    void throttleCountsTheSendWithoutMakingACode() {
        otp.throttle(PURPOSE, EMAIL);

        assertEquals(null, entry(PURPOSE).code());
        assertError(OtpError.TOO_FREQUENT, () -> otp.throttle(PURPOSE, EMAIL));
    }

    @Test
    void guessesOnAnEmailWithoutACodeLockOutLikeWrongCodes() {
        lockOut(PURPOSE);

        clock.advance(COOLDOWN);
        assertError(OtpError.MAX_ATTEMPTS_EXCEEDED, () -> otp.throttle(PURPOSE, EMAIL));
    }

    // ───────── one purpose cannot use another's code (Q-05) ─────────

    @Test
    void registrationCodeCannotResetPassword() {
        OtpCode code = otp.issue(OtpPurpose.VERIFY_ACCOUNT, EMAIL);

        assertFalse(accepts(OtpPurpose.RESET_PASSWORD, code));
        // still valid for what it was sent for
        assertTrue(accepts(OtpPurpose.VERIFY_ACCOUNT, code));
    }

    @Test
    void lockoutOfOnePurposeDoesNotBlockTheOther() {
        lockOut(OtpPurpose.VERIFY_ACCOUNT);

        assertNotNull(otp.issue(OtpPurpose.RESET_PASSWORD, EMAIL));
    }

    // ───────── parallel requests ─────────

    @Test
    void parallelWrongGuessesCannotExceedMaxAttempts() throws Exception {
        otp.issue(PURPOSE, EMAIL);

        List<Object> results = runInParallel(64, () -> accepts(PURPOSE, WRONG));

        assertEquals(
                MAX_ATTEMPTS - 1, results.stream().filter(Boolean.FALSE::equals).count());
        assertEquals(
                64 - (MAX_ATTEMPTS - 1),
                results.stream().filter(OtpError.MAX_ATTEMPTS_EXCEEDED::equals).count());
    }

    @Test
    void parallelRightGuessesRedeemTheCodeOnce() throws Exception {
        OtpCode code = otp.issue(PURPOSE, EMAIL);

        List<Object> results = runInParallel(16, () -> accepts(PURPOSE, code));

        assertEquals(1, results.stream().filter(Boolean.TRUE::equals).count());
    }

    @Test
    void parallelSendsAreCountedOnce() throws Exception {
        List<Object> results = runInParallel(16, () -> otp.issue(PURPOSE, EMAIL));

        assertEquals(1, results.stream().filter(OtpCode.class::isInstance).count());
        assertEquals(1, entry(PURPOSE).sendCount());
    }

    @Test
    void codesDifferFromOneEmailToAnother() {
        // not a proof of randomness: a constant code would fail
        OtpCode first = otp.issue(PURPOSE, EMAIL);
        boolean anyDifferent = false;
        for (int i = 0; i < 5 && !anyDifferent; i++) {
            anyDifferent = !first.equals(otp.issue(PURPOSE, Email.parse("b" + i + "@x.vn")));
        }
        assertTrue(anyDifferent);
    }

    /** True when the code is accepted, false for a plain "wrong or expired code"; a lockout still throws. */
    private boolean accepts(OtpPurpose purpose, OtpCode code) {
        try {
            otp.verify(purpose, EMAIL, code);
            return true;
        } catch (AppException e) {
            if (e.getErrorCode() == OtpError.INVALID_OR_EXPIRED) {
                return false;
            }
            throw e;
        }
    }

    private void lockOut(OtpPurpose purpose) {
        for (int i = 1; i < MAX_ATTEMPTS; i++) {
            assertFalse(accepts(purpose, WRONG));
        }
        assertError(OtpError.MAX_ATTEMPTS_EXCEEDED, () -> otp.verify(purpose, EMAIL, WRONG));
    }

    private OtpEntry entry(OtpPurpose purpose) {
        return store.read(new OtpKey(purpose, EMAIL));
    }

    private static void assertError(ErrorCode expected, Executable call) {
        assertEquals(expected, assertThrows(AppException.class, call).getErrorCode());
    }

    /** Starts all tasks at once; each result is the return value or the error code it failed with. */
    private static List<Object> runInParallel(int threads, Callable<?> task) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Object>> futures = new ArrayList<>();
            for (int i = 0; i < threads; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    try {
                        return task.call();
                    } catch (AppException e) {
                        return e.getErrorCode();
                    }
                }));
            }
            start.countDown();
            List<Object> results = new ArrayList<>();
            for (Future<Object> future : futures) {
                results.add(future.get(10, TimeUnit.SECONDS));
            }
            return results;
        } finally {
            pool.shutdownNow();
        }
    }

    /** The store as InMemoryOtpStore builds it, plus a way for the test to look inside. */
    private final class MapOtpStore implements OtpStore {

        private final ExpiringMap<OtpKey, OtpEntry> entries = new ExpiringMap<>(clock);

        @Override
        public OtpEntry update(OtpKey key, UnaryOperator<OtpEntry> change, Duration retention) {
            return entries.compute(key, current -> change.apply(current == null ? OtpEntry.EMPTY : current), retention)
                    .orElseThrow();
        }

        OtpEntry read(OtpKey key) {
            return entries.get(key).orElse(OtpEntry.EMPTY);
        }
    }
}
