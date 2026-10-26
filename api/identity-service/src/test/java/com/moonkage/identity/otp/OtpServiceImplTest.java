package com.moonkage.identity.otp;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.vo.Email;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OtpServiceImplTest {

    private static final Email TEST_EMAIL = Email.of("a@x.vn");
    private static final OtpPurpose PURPOSE = OtpPurpose.VERIFY_ACCOUNT;
    private static final OtpServiceImpl.OtpKey KEY = new OtpServiceImpl.OtpKey(PURPOSE, TEST_EMAIL);
    private static final OtpServiceImpl.OtpKey OLD_KEY = new OtpServiceImpl.OtpKey(PURPOSE, Email.of("old@x.vn"));

    private OtpServiceImpl service;

    @BeforeEach
    void setUp() {
        OtpProperties properties = new OtpProperties();
        properties.setExpiration(Duration.ofMinutes(5));
        properties.setMaxAttempts(3);
        properties.setResendCooldown(Duration.ofSeconds(60));
        properties.setMaxResendPerHour(5);
        properties.setLockoutDuration(Duration.ofMinutes(15));
        service = new OtpServiceImpl(properties);
    }

    @Test
    void issueAndVerifyOtpSuccess() {
        String otp = service.issueOtp(PURPOSE, TEST_EMAIL);
        assertNotNull(otp);
        assertEquals(6, otp.length());
        assertTrue(accepts(PURPOSE, TEST_EMAIL, otp));
    }

    @Test
    void issueOtpDuringCooldownThrowsTooFrequent() {
        service.issueOtp(PURPOSE, TEST_EMAIL);

        AppException ex = assertThrows(AppException.class, () -> service.issueOtp(PURPOSE, TEST_EMAIL));
        assertEquals(ErrorCode.OTP_TOO_FREQUENT, ex.getErrorCode());
    }

    @Test
    void issueOtpAfterCooldownReusesActiveOtpWithoutResettingAttempts() {
        String firstOtp = service.issueOtp(PURPOSE, TEST_EMAIL);

        // Giả lập người dùng nhập sai 1 lần
        assertFalse(accepts(PURPOSE, TEST_EMAIL, "000000"));

        // Giả lập thời gian đã trôi qua 61 giây (hết cooldown nhưng mã 5m vẫn còn hạn)
        OtpServiceImpl.OtpEntry entry = service.otpEntries.get(KEY);
        service.otpEntries.put(
                KEY,
                new OtpServiceImpl.OtpEntry(
                        entry.otp(),
                        entry.expiresAt(),
                        entry.attempts(),
                        Instant.now().minusSeconds(61),
                        entry.sendCount(),
                        entry.sendWindowStart(),
                        null));

        String resentOtp = service.issueOtp(PURPOSE, TEST_EMAIL);
        assertEquals(firstOtp, resentOtp, "Mã OTP phải được tái sử dụng nếu chưa hết hạn TTL");

        // Bộ đếm attempts không được reset về 0
        OtpServiceImpl.OtpEntry updated = service.otpEntries.get(KEY);
        assertEquals(1, updated.attempts(), "Số lần thử sai không được reset về 0 khi gửi lại mã");
    }

    @Test
    void issueOtpExceedingHourlyQuotaThrowsLimitExceeded() {
        for (int i = 0; i < 5; i++) {
            OtpServiceImpl.OtpEntry current = service.otpEntries.get(KEY);
            Instant windowStart = current != null ? current.sendWindowStart() : Instant.now();
            service.otpEntries.put(
                    KEY,
                    new OtpServiceImpl.OtpEntry(
                            "123456",
                            Instant.now().plusSeconds(300),
                            0,
                            Instant.now().minusSeconds(61), // giả lập đã qua cooldown
                            i,
                            windowStart,
                            null));
            service.issueOtp(PURPOSE, TEST_EMAIL);
        }

        // Lần thứ 6 trong vòng 1 giờ
        OtpServiceImpl.OtpEntry current = service.otpEntries.get(KEY);
        service.otpEntries.put(
                KEY,
                new OtpServiceImpl.OtpEntry(
                        current.otp(),
                        current.expiresAt(),
                        current.attempts(),
                        Instant.now().minusSeconds(61),
                        5,
                        current.sendWindowStart(),
                        null));

        AppException ex = assertThrows(AppException.class, () -> service.issueOtp(PURPOSE, TEST_EMAIL));
        assertEquals(ErrorCode.OTP_SEND_LIMIT_EXCEEDED, ex.getErrorCode());
    }

    @Test
    void verifyOtpExceedingMaxAttemptsLocksUserOut() {
        String otp = service.issueOtp(PURPOSE, TEST_EMAIL);

        // Nhập sai 2 lần đầu
        assertFalse(accepts(PURPOSE, TEST_EMAIL, "000000"));
        assertFalse(accepts(PURPOSE, TEST_EMAIL, "111111"));

        // Lần thứ 3 vi phạm maxAttempts -> ném OTP_MAX_ATTEMPTS_EXCEEDED
        AppException ex = assertThrows(AppException.class, () -> service.verifyOtp(PURPOSE, TEST_EMAIL, "222222"));
        assertEquals(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED, ex.getErrorCode());

        // Trong thời gian bị khóa, cố gắng issueOtp cũng bị từ chối
        AppException issueEx = assertThrows(AppException.class, () -> service.issueOtp(PURPOSE, TEST_EMAIL));
        assertEquals(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED, issueEx.getErrorCode());

        // Và cố gắng verifyOtp tiếp cũng bị từ chối
        AppException verifyEx = assertThrows(AppException.class, () -> service.verifyOtp(PURPOSE, TEST_EMAIL, otp));
        assertEquals(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED, verifyEx.getErrorCode());
    }

    @Test
    void clearOtpRemovesSession() {
        String otp = service.issueOtp(PURPOSE, TEST_EMAIL);
        service.clearOtp(PURPOSE, TEST_EMAIL);
        assertFalse(accepts(PURPOSE, TEST_EMAIL, otp));
    }

    @Test
    void clearOtpKeepsLockout() {
        service.issueOtp(PURPOSE, TEST_EMAIL);
        lockOut(TEST_EMAIL);

        service.clearOtp(PURPOSE, TEST_EMAIL);

        AppException ex = assertThrows(AppException.class, () -> service.issueOtp(PURPOSE, TEST_EMAIL));
        assertEquals(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED, ex.getErrorCode());
    }

    @Test
    void verifyOtpConsumesCodeOnSuccess() {
        String otp = service.issueOtp(PURPOSE, TEST_EMAIL);
        assertTrue(accepts(PURPOSE, TEST_EMAIL, otp));
        assertFalse(accepts(PURPOSE, TEST_EMAIL, otp));
    }

    @Test
    void lockoutExpiryStartsFreshRoundOfAttempts() {
        service.issueOtp(PURPOSE, TEST_EMAIL);
        lockOut(TEST_EMAIL);
        OtpServiceImpl.OtpEntry locked = service.otpEntries.get(KEY);
        service.otpEntries.put(
                KEY,
                new OtpServiceImpl.OtpEntry(
                        locked.otp(),
                        locked.expiresAt(),
                        locked.attempts(),
                        locked.lastSentAt(),
                        locked.sendCount(),
                        locked.sendWindowStart(),
                        Instant.now().minusSeconds(1)));

        assertFalse(accepts(PURPOSE, TEST_EMAIL, "000000"));
        assertEquals(1, service.otpEntries.get(KEY).attempts());
    }

    // ───────── parallel requests (A) ─────────

    @Test
    void parallelWrongGuessesCannotExceedMaxAttempts() throws Exception {
        service.issueOtp(PURPOSE, TEST_EMAIL);

        List<Object> results = runInParallel(64, () -> accepts(PURPOSE, TEST_EMAIL, "000000"));

        long plainFailures = results.stream().filter(Boolean.FALSE::equals).count();
        long lockouts = results.stream()
                .filter(r -> r instanceof AppException e && e.getErrorCode() == ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED)
                .count();
        assertEquals(2, plainFailures, "only maxAttempts - 1 guesses may get a plain 'wrong code'");
        assertEquals(62, lockouts);
    }

    @Test
    void parallelCorrectGuessesRedeemCodeOnce() throws Exception {
        String otp = service.issueOtp(PURPOSE, TEST_EMAIL);

        List<Object> results = runInParallel(16, () -> accepts(PURPOSE, TEST_EMAIL, otp));

        assertEquals(1, results.stream().filter(Boolean.TRUE::equals).count());
    }

    @Test
    void parallelSendsAreCountedOnce() throws Exception {
        List<Object> results = runInParallel(16, () -> service.issueOtp(PURPOSE, TEST_EMAIL));

        long sent = results.stream().filter(String.class::isInstance).count();
        assertEquals(1, sent, "cooldown must let exactly one of the parallel sends through");
        assertEquals(1, service.otpEntries.get(KEY).sendCount());
    }

    // ───────── unknown email answers like a known one (B) ─────────

    @Test
    void throttleSendAppliesCooldownWithoutIssuingCode() {
        service.throttleSend(PURPOSE, TEST_EMAIL);

        assertNull(service.otpEntries.get(KEY).otp());
        AppException ex = assertThrows(AppException.class, () -> service.throttleSend(PURPOSE, TEST_EMAIL));
        assertEquals(ErrorCode.OTP_TOO_FREQUENT, ex.getErrorCode());
    }

    @Test
    void verifyOnEmailWithoutCodeLocksOutLikeWrongCode() {
        lockOut(TEST_EMAIL);

        AppException ex = assertThrows(AppException.class, () -> service.throttleSend(PURPOSE, TEST_EMAIL));
        assertEquals(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED, ex.getErrorCode());
    }

    @Test
    void purgeDropsOnlyStaleEntries() {
        service.issueOtp(PURPOSE, TEST_EMAIL);
        service.otpEntries.put(
                OLD_KEY,
                new OtpServiceImpl.OtpEntry(
                        null,
                        null,
                        0,
                        Instant.now().minusSeconds(7200),
                        1,
                        Instant.now().minusSeconds(7200),
                        null));

        service.purgeStaleEntries();

        assertTrue(service.otpEntries.containsKey(KEY));
        assertFalse(service.otpEntries.containsKey(OLD_KEY));
    }

    // ───────── one purpose cannot use another's code (Q-05) ─────────

    @Test
    void registrationCodeCannotResetPassword() {
        String otp = service.issueOtp(OtpPurpose.VERIFY_ACCOUNT, TEST_EMAIL);

        assertFalse(accepts(OtpPurpose.RESET_PASSWORD, TEST_EMAIL, otp));
        // still valid for what it was sent for
        assertTrue(accepts(OtpPurpose.VERIFY_ACCOUNT, TEST_EMAIL, otp));
    }

    @Test
    void lockoutOfOnePurposeDoesNotBlockTheOther() {
        lockOut(TEST_EMAIL);

        assertNotNull(service.issueOtp(OtpPurpose.RESET_PASSWORD, TEST_EMAIL));
    }

    /** True when the code is accepted, false for a plain "wrong or expired code"; a lockout still throws. */
    private boolean accepts(OtpPurpose purpose, Email email, String otp) {
        try {
            service.verifyOtp(purpose, email, otp);
            return true;
        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.OTP_INVALID_OR_EXPIRED) {
                return false;
            }
            throw e;
        }
    }

    private void lockOut(Email email) {
        assertFalse(accepts(PURPOSE, email, "000000"));
        assertFalse(accepts(PURPOSE, email, "000000"));
        assertThrows(AppException.class, () -> service.verifyOtp(PURPOSE, email, "000000"));
    }

    /** Starts all tasks at once; each result is the return value or the thrown exception. */
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
                        return e;
                    }
                }));
            }
            start.countDown();
            List<Object> results = new ArrayList<>();
            for (Future<Object> f : futures) {
                results.add(f.get(10, TimeUnit.SECONDS));
            }
            return results;
        } finally {
            pool.shutdownNow();
        }
    }
}
