package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.CredentialCheck;
import com.moonkage.identity.account.LoginIdentifier;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.auth.AuthError;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.value.ValueRejected;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** FR-02: an email or national phone number and a password open a session. */
@Service
@RequiredArgsConstructor
public class Login {

    private final AccountApi accountApi;
    private final SessionOpener sessionOpener;

    /**
     * Throws INVALID_CREDENTIALS for an unknown identifier and a wrong password alike, and ACCOUNT_NOT_ACTIVATED only
     * once the password has matched.
     */
    public Session handle(Command command) {
        LoginIdentifier loginIdentifier;
        try {
            loginIdentifier = LoginIdentifier.parse(command.identifier());
        } catch (ValueRejected e) {
            // no account can have it, so answering at once tells nothing about any account
            throw new AppException(AuthError.INVALID_CREDENTIALS);
        }
        return switch (accountApi.verifyCredentials(loginIdentifier, command.password())) {
            case CredentialCheck.Accepted accepted -> sessionOpener.open(accepted.account());
            case CredentialCheck.NotActivated notActivated -> throw new AppException(AuthError.ACCOUNT_NOT_ACTIVATED);
            case CredentialCheck.Rejected rejected -> throw new AppException(AuthError.INVALID_CREDENTIALS);
        };
    }

    /**
     * What a login is asked with.
     *
     * @param identifier as typed; one that is neither an email nor a national phone number belongs to no account
     * @param password checked as given, without the length policy of a new password
     */
    public record Command(String identifier, RawPassword password) {}
}
