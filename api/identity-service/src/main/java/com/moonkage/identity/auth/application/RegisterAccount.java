package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-01: a member account and its profile, in one transaction, then the confirmation code by mail. */
@Service
@RequiredArgsConstructor
public class RegisterAccount {

    private final AccountApi accountApi;
    private final ProfileApi profileApi;
    private final OtpDelivery otpDelivery;

    /**
     * Throws EMAIL_ALREADY_EXISTS or PHONE_ALREADY_EXISTS. A failed mail keeps the account: the user asks for a new
     * code, since registering again would hit "email already used".
     */
    @Transactional
    public Registration handle(Command command) {
        AccountView account = accountApi.registerMember(command.email(), command.phoneNumber(), command.password());
        profileApi.create(account.id(), command.fullName());
        return new Registration(account, trySendConfirmationCode(command.email(), command.fullName()));
    }

    private boolean trySendConfirmationCode(Email email, FullName fullName) {
        try {
            otpDelivery.sendConfirmationCode(email, fullName.value());
            return true;
        } catch (AppException e) {
            return false;
        }
    }

    /**
     * A registration, every field already parsed.
     *
     * @param phoneNumber null when none was given
     */
    public record Command(Email email, PhoneNumber phoneNumber, FullName fullName, RawPassword password) {}
}
