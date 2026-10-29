package com.moonkage.identity.account.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.CredentialCheck;
import com.moonkage.identity.account.LoginIdentifier;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.account.domain.Account;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.id.SequentialIdGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** FR-02, ĐIỂM DỪNG E: the four ways out of a credential check, and what each one may reveal. */
class VerifyCredentialsTest {

    private static final AccountId ID = new AccountId(SequentialIdGenerator.nth(1));
    private static final Email EMAIL = Email.parse("lan@x.vn");
    private static final PhoneNumber PHONE = PhoneNumber.parse("0912345678");
    private static final RawPassword PASSWORD = RawPassword.forLogin("secret-123");
    private static final RawPassword WRONG_PASSWORD = RawPassword.forLogin("secret-124");

    private final InMemoryAccountRepository accounts = new InMemoryAccountRepository();
    private final RecordingPasswordHasher hasher = new RecordingPasswordHasher();
    private final VerifyCredentials verifyCredentials = new VerifyCredentials(accounts, hasher);

    private Account account;

    @BeforeEach
    void setUp() {
        account = Account.registerMember(ID, EMAIL, PHONE, hasher.hash(PASSWORD));
        accounts.add(account);
    }

    @Test
    void unknownIdentifierIsRejectedAfterADummyCheck() {
        CredentialCheck check = verifyCredentials.handle(byEmail("mai@x.vn"), PASSWORD);

        assertInstanceOf(CredentialCheck.Rejected.class, check);
        // the hash work is done anyway: the reply takes as long as for a wrong password
        assertEquals(1, hasher.dummyMatches());
    }

    @Test
    void wrongPasswordIsRejectedLikeAnUnknownIdentifier() {
        CredentialCheck check = verifyCredentials.handle(byEmail("lan@x.vn"), WRONG_PASSWORD);

        assertEquals(new CredentialCheck.Rejected(), check);
        assertEquals(1, hasher.matches());
        assertEquals(0, hasher.dummyMatches());
    }

    @Test
    void wrongPasswordOfAnUnconfirmedAccountDoesNotRevealTheAccount() {
        // "not activated" would tell a stranger that the email has an account
        assertEquals(new CredentialCheck.Rejected(), verifyCredentials.handle(byEmail("lan@x.vn"), WRONG_PASSWORD));
    }

    @Test
    void rightPasswordOfAnUnconfirmedAccountIsNotActivated() {
        assertEquals(new CredentialCheck.NotActivated(), verifyCredentials.handle(byEmail("lan@x.vn"), PASSWORD));
    }

    @Test
    void rightPasswordOfAConfirmedAccountIsAccepted() {
        account.confirmEmail();

        CredentialCheck check = verifyCredentials.handle(byEmail("lan@x.vn"), PASSWORD);

        AccountView view =
                assertInstanceOf(CredentialCheck.Accepted.class, check).account();
        assertEquals(ID, view.id());
        assertEquals(EMAIL, view.email());
    }

    @Test
    void phoneNumberWorksLikeTheEmail() {
        account.confirmEmail();

        assertInstanceOf(
                CredentialCheck.Accepted.class,
                verifyCredentials.handle(LoginIdentifier.parse("0912345678"), PASSWORD));
        assertInstanceOf(
                CredentialCheck.Rejected.class,
                verifyCredentials.handle(LoginIdentifier.parse("0987654321"), PASSWORD));
        assertEquals(1, hasher.dummyMatches());
    }

    @Test
    void passwordSetBeforeThePolicyStillLogsIn() {
        // RawPassword.forLogin does not apply the length policy of RawPassword.parse
        RawPassword shortOldPassword = RawPassword.forLogin("old");
        Account old = Account.registerMember(
                new AccountId(SequentialIdGenerator.nth(2)),
                Email.parse("old@x.vn"),
                null,
                hasher.hash(shortOldPassword));
        old.confirmEmail();
        accounts.add(old);

        assertInstanceOf(
                CredentialCheck.Accepted.class, verifyCredentials.handle(byEmail("old@x.vn"), shortOldPassword));
    }

    private static LoginIdentifier byEmail(String email) {
        return LoginIdentifier.parse(email);
    }
}
