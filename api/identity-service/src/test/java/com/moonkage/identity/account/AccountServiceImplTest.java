package com.moonkage.identity.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.atom.Email;
import com.moonkage.identity.account.atom.PasswordHash;
import com.moonkage.identity.account.atom.PhoneNumber;
import com.moonkage.identity.account.atom.Role;
import com.moonkage.identity.account.dto.AccountView;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import java.sql.SQLException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    private static final String ACCOUNT_ID = "6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10";
    private static final String UNKNOWN_ID = "0b7e4c19-2f5a-4d8e-a613-9c4d2e8f7a55";
    private static final Email EMAIL = Email.of("a@x.vn");
    private static final PhoneNumber PHONE = PhoneNumber.of("0912345678");
    private static final PasswordHash HASH =
            PasswordHash.of("$2a$10$abcdefghijklmnopqrstuuJ8r6b0qkF3U9e5R1yW2Hn0mDxv3pL7a");

    private static final Instant NOW = Instant.parse("2026-10-29T08:00:00Z");

    @Mock
    private AccountRepository accountRepository;

    private AccountServiceImpl accountService;

    @BeforeEach
    void setUp() {
        accountService = new AccountServiceImpl(accountRepository, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void unknownAccountAnswersNotFound() {
        when(accountRepository.findById(UNKNOWN_ID)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> accountService.getAccount(UNKNOWN_ID));

        assertEquals(ErrorCode.ACCOUNT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void newMemberIsUnverified() {
        // JPA gives the id on save
        when(accountRepository.saveAndFlush(any(Account.class)))
                .thenAnswer(inv -> AccountFixtures.withId(inv.getArgument(0), ACCOUNT_ID));

        AccountView member = accountService.createMember(EMAIL, PHONE, HASH);

        assertEquals(ACCOUNT_ID, member.id());
        assertEquals("a@x.vn", member.email());
        assertEquals("912345678", member.phoneNumber());
        assertEquals(Role.MEMBER, member.role());
        assertFalse(member.verified());
    }

    @Test
    void confirmingTheEmailVerifiesTheAccount() {
        Account account = AccountFixtures.withId(Account.registerMember(EMAIL, PHONE, HASH), ACCOUNT_ID);
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account));

        assertTrue(accountService.confirmEmail(ACCOUNT_ID).verified());
        assertTrue(account.isAccountVerified());
    }

    @Test
    void takenEmailIsRejectedBeforeSaving() {
        when(accountRepository.existsByEmail(EMAIL)).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> accountService.createMember(EMAIL, PHONE, HASH));

        assertEquals(ErrorCode.EMAIL_ALREADY_EXISTS, ex.getErrorCode());
        verify(accountRepository, never()).saveAndFlush(any());
    }

    @Test
    void parallelRegistrationWithTheSameEmailAnswers409Not500() {
        // both requests passed the pre-check; the unique key stops the second one at flush
        when(accountRepository.saveAndFlush(any(Account.class))).thenThrow(duplicateKey(Account.EMAIL_UNIQUE_KEY));

        AppException ex = assertThrows(AppException.class, () -> accountService.createMember(EMAIL, PHONE, HASH));

        assertEquals(ErrorCode.EMAIL_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    void parallelRegistrationWithTheSamePhoneAnswers409Not500() {
        when(accountRepository.saveAndFlush(any(Account.class)))
                .thenThrow(duplicateKey(Account.PHONE_NUMBER_UNIQUE_KEY));

        AppException ex = assertThrows(AppException.class, () -> accountService.createMember(EMAIL, PHONE, HASH));

        assertEquals(ErrorCode.PHONE_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    void passwordChangeEndsOlderTokens() {
        Account account = account(true);
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(account));

        accountService.changePassword(ACCOUNT_ID, HASH);

        assertEquals(HASH, account.getPasswordHash());
        // the time comes from the Clock bean
        assertEquals(NOW, account.getPasswordChangedAt());
        assertFalse(AccountMapper.toView(account).acceptsTokenIssuedAt(NOW.minusSeconds(60)));
        assertTrue(AccountMapper.toView(account).acceptsTokenIssuedAt(NOW));
    }

    @Test
    void lockForUpdateOfAnUnknownAccountAnswersNotFound() {
        when(accountRepository.findByIdForUpdate(UNKNOWN_ID)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> accountService.lockForUpdate(UNKNOWN_ID));

        assertEquals(ErrorCode.ACCOUNT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void loginFindsTheAccountByEmailOrPhone() {
        when(accountRepository.findByEmail(EMAIL)).thenReturn(Optional.of(account(true)));
        when(accountRepository.findByPhoneNumber(PHONE)).thenReturn(Optional.of(account(true)));

        assertTrue(accountService.findCredentials("A@X.vn").isPresent());
        assertTrue(accountService.findCredentials("0912345678").isPresent());
        // decision C1: only the national form is a phone login
        assertTrue(accountService.findCredentials("+84912345678").isEmpty());
        assertTrue(accountService.findCredentials("not-a-login").isEmpty());
    }

    private static Account account(boolean verified) {
        Account account = AccountFixtures.withId(Account.registerMember(EMAIL, null, HASH), ACCOUNT_ID);
        if (verified) {
            account.confirmEmail();
        }
        return account;
    }

    private static DataIntegrityViolationException duplicateKey(String constraintName) {
        return new DataIntegrityViolationException(
                "duplicate key",
                new ConstraintViolationException("duplicate key", new SQLException("23505"), constraintName));
    }
}
