package com.moonkage.identity.auth.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.auth.application.port.OtpMailer;
import com.moonkage.identity.auth.application.port.OtpMailer.OtpMail;
import com.moonkage.identity.otp.OtpApi;
import com.moonkage.identity.otp.OtpCode;
import com.moonkage.identity.otp.OtpError;
import com.moonkage.identity.otp.OtpPurpose;
import com.moonkage.identity.profile.UserProfileService;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import java.time.Duration;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

/**
 * FR-01, FR-02: the use cases that send or take a one-time code. The send endpoints answer the same whether the email
 * has an account or not.
 */
class OtpUseCasesTest {

    private static final AccountView CONFIRMED = LoginTest.ACCOUNT;
    private static final AccountView UNCONFIRMED =
            new AccountView(CONFIRMED.id(), CONFIRMED.email(), null, Role.MEMBER, false, null);
    private static final Email EMAIL = CONFIRMED.email();
    private static final String ID = CONFIRMED.id().toString();
    private static final OtpCode CODE = new OtpCode("123456");
    private static final Duration LIFETIME = Duration.ofMinutes(5);
    private static final RawPassword PASSWORD = RawPassword.parse("secret-123");

    private final AccountApi accountApi = mock(AccountApi.class);
    private final OtpApi otpApi = mock(OtpApi.class);
    private final OtpMailer mailer = mock(OtpMailer.class);
    private final UserProfileService profiles = mock(UserProfileService.class);
    private final OtpDelivery delivery = new OtpDelivery(otpApi, mailer, profiles);

    @BeforeEach
    void setUp() {
        when(otpApi.codeLifetime()).thenReturn(LIFETIME);
        when(otpApi.issue(any(), eq(EMAIL))).thenReturn(CODE);
    }

    // ───────── RegisterAccount ─────────

    @Test
    void registrationCreatesAccountAndProfileThenMailsTheCode() {
        PhoneNumber phone = PhoneNumber.parse("0912345678");
        when(accountApi.registerMember(EMAIL, phone, PASSWORD)).thenReturn(UNCONFIRMED);

        Registration registration = register(phone);

        verify(profiles).createProfile(ID, "Nguyen Lan");
        verify(mailer).send(OtpMail.ACCOUNT_CONFIRMATION, EMAIL, "Nguyen Lan", CODE, LIFETIME);
        assertEquals(new Registration(UNCONFIRMED, true), registration);
    }

    @Test
    void failedMailKeepsTheAccountAndDropsTheCode() {
        when(accountApi.registerMember(any(), any(), any())).thenReturn(UNCONFIRMED);
        mailFails(OtpMail.ACCOUNT_CONFIRMATION);

        assertFalse(register(null).otpSent());
        verify(otpApi).discard(OtpPurpose.VERIFY_ACCOUNT, EMAIL);
    }

    @Test
    void takenIdentifierStopsRegistrationBeforeTheProfile() {
        when(accountApi.registerMember(any(), any(), any()))
                .thenThrow(new AppException(AccountError.EMAIL_ALREADY_EXISTS, EMAIL.value()));

        assertError(AccountError.EMAIL_ALREADY_EXISTS, () -> register(null));
        verify(profiles, never()).createProfile(anyString(), anyString());
    }

    // ───────── ResendVerifyOtp ─────────

    @Test
    void resendMailsAnUnconfirmedAccountUnderItsName() {
        when(accountApi.findByEmail(EMAIL)).thenReturn(Optional.of(UNCONFIRMED));
        when(profiles.findFullName(ID)).thenReturn(Optional.of("Nguyen Lan"));

        resend().handle(EMAIL);

        verify(mailer).send(OtpMail.ACCOUNT_CONFIRMATION, EMAIL, "Nguyen Lan", CODE, LIFETIME);
        verify(otpApi, never()).throttle(any(), any());
    }

    @Test
    void resendOnlyThrottlesAnUnknownOrConfirmedEmail() {
        when(accountApi.findByEmail(EMAIL)).thenReturn(Optional.empty(), Optional.of(CONFIRMED));

        resend().handle(EMAIL);
        resend().handle(EMAIL);

        verify(otpApi, times(2)).throttle(OtpPurpose.VERIFY_ACCOUNT, EMAIL);
        verify(otpApi, never()).issue(any(), any());
    }

    @Test
    void resendReportsAFailedMail() {
        when(accountApi.findByEmail(EMAIL)).thenReturn(Optional.of(UNCONFIRMED));
        when(profiles.findFullName(ID)).thenReturn(Optional.empty());
        mailFails(OtpMail.ACCOUNT_CONFIRMATION);

        assertError(AuthError.EMAIL_DELIVERY_FAILED, () -> resend().handle(EMAIL));
        verify(otpApi).discard(OtpPurpose.VERIFY_ACCOUNT, EMAIL);
    }

    // ───────── SendResetPasswordOtp ─────────

    @Test
    void resetCodeGoesToAConfirmedAccountNamedByEmailWithoutProfile() {
        when(accountApi.findByEmail(EMAIL)).thenReturn(Optional.of(CONFIRMED));
        when(profiles.findFullName(ID)).thenReturn(Optional.empty());

        sendReset().handle(EMAIL);

        verify(mailer).send(OtpMail.PASSWORD_RESET, EMAIL, EMAIL.value(), CODE, LIFETIME);
        verify(otpApi, never()).throttle(any(), any());
    }

    @Test
    void resetCodeOnlyThrottlesAnUnknownOrUnconfirmedEmail() {
        when(accountApi.findByEmail(EMAIL)).thenReturn(Optional.empty(), Optional.of(UNCONFIRMED));

        sendReset().handle(EMAIL);
        sendReset().handle(EMAIL);

        verify(otpApi, times(2)).throttle(OtpPurpose.RESET_PASSWORD, EMAIL);
        verify(otpApi, never()).issue(any(), any());
    }

    @Test
    void failedResetMailIsSilent() {
        when(accountApi.findByEmail(EMAIL)).thenReturn(Optional.of(CONFIRMED));
        when(profiles.findFullName(ID)).thenReturn(Optional.empty());
        mailFails(OtpMail.PASSWORD_RESET);

        sendReset().handle(EMAIL);
    }

    @Test
    void cooldownOfAnUnknownEmailIsPassedOn() {
        when(accountApi.findByEmail(EMAIL)).thenReturn(Optional.empty());
        doThrow(new AppException(OtpError.TOO_FREQUENT, 30L)).when(otpApi).throttle(OtpPurpose.RESET_PASSWORD, EMAIL);

        assertError(OtpError.TOO_FREQUENT, () -> sendReset().handle(EMAIL));
    }

    // ───────── VerifyAccount, ResetPassword ─────────

    @Test
    void rightConfirmationCodeConfirmsTheEmail() {
        when(accountApi.findByEmail(EMAIL)).thenReturn(Optional.of(UNCONFIRMED));
        when(accountApi.confirmEmail(CONFIRMED.id())).thenReturn(CONFIRMED);

        AccountView confirmed = new VerifyAccount(otpApi, accountApi).handle(new VerifyAccount.Command(EMAIL, CODE));

        verify(otpApi).verify(OtpPurpose.VERIFY_ACCOUNT, EMAIL, CODE);
        assertTrue(confirmed.verified());
    }

    @Test
    void resetAcceptsOnlyAResetCodeAndChangesThePassword() {
        when(accountApi.findByEmail(EMAIL)).thenReturn(Optional.of(CONFIRMED));

        new ResetPassword(otpApi, accountApi).handle(new ResetPassword.Command(EMAIL, CODE, PASSWORD));

        verify(otpApi).verify(OtpPurpose.RESET_PASSWORD, EMAIL, CODE);
        verify(otpApi, never()).verify(eq(OtpPurpose.VERIFY_ACCOUNT), any(), any());
        verify(accountApi).changePassword(CONFIRMED.id(), PASSWORD);
    }

    @Test
    void rightCodeOfAnAccountThatIsGoneCountsAsWrong() {
        when(accountApi.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertError(
                OtpError.INVALID_OR_EXPIRED,
                () -> new VerifyAccount(otpApi, accountApi).handle(new VerifyAccount.Command(EMAIL, CODE)));
        assertError(
                OtpError.INVALID_OR_EXPIRED,
                () -> new ResetPassword(otpApi, accountApi).handle(new ResetPassword.Command(EMAIL, CODE, PASSWORD)));
        verify(accountApi, never()).changePassword(any(), any());
    }

    private Registration register(PhoneNumber phone) {
        return new RegisterAccount(accountApi, profiles, delivery)
                .handle(new RegisterAccount.Command(EMAIL, phone, "Nguyen Lan", PASSWORD));
    }

    private ResendVerifyOtp resend() {
        return new ResendVerifyOtp(accountApi, otpApi, delivery);
    }

    private SendResetPasswordOtp sendReset() {
        return new SendResetPasswordOtp(accountApi, otpApi, delivery);
    }

    private void mailFails(OtpMail mail) {
        doThrow(new AppException(AuthError.EMAIL_DELIVERY_FAILED, EMAIL.value()))
                .when(mailer)
                .send(eq(mail), any(), any(), any(), any());
    }

    private static void assertError(Object expected, Executable call) {
        assertEquals(expected, assertThrows(AppException.class, call).getErrorCode());
    }
}
