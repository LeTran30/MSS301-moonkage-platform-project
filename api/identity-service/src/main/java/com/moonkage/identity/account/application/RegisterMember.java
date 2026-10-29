package com.moonkage.identity.account.application;

import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.account.application.port.AccountRepository;
import com.moonkage.identity.account.application.port.PasswordHasher;
import com.moonkage.identity.account.domain.Account;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.id.IdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-01: a new MEMBER whose email is not confirmed yet. */
@Service
@RequiredArgsConstructor
class RegisterMember {

    private final AccountRepository accounts;
    private final PasswordHasher passwordHasher;
    private final IdGenerator idGenerator;

    /** Throws EMAIL_ALREADY_EXISTS / PHONE_ALREADY_EXISTS (AC-01.3). {@code phoneNumber} may be null. */
    @Transactional
    AccountView handle(Email email, PhoneNumber phoneNumber, RawPassword password) {
        if (accounts.findByEmail(email).isPresent()) {
            throw new AppException(AccountError.EMAIL_ALREADY_EXISTS, email.value());
        }
        if (phoneNumber != null && accounts.findByPhoneNumber(phoneNumber).isPresent()) {
            throw new AppException(AccountError.PHONE_ALREADY_EXISTS, phoneNumber.value());
        }
        Account account = Account.registerMember(
                new AccountId(idGenerator.next()), email, phoneNumber, passwordHasher.hash(password));
        accounts.add(account);
        return account.view();
    }
}
