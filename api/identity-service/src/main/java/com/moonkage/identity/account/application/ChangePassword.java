package com.moonkage.identity.account.application;

import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.account.application.port.AccountRepository;
import com.moonkage.identity.account.application.port.PasswordHasher;
import com.moonkage.identity.shared.AccountId;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-02: a new password; tokens issued before it stop working (Q-04). */
@Service
@RequiredArgsConstructor
class ChangePassword {

    private final AccountRepository accounts;
    private final PasswordHasher passwordHasher;
    private final Clock clock;

    /** Throws NOT_FOUND. */
    @Transactional
    void handle(AccountId id, RawPassword newPassword) {
        accounts.find(id)
                .orElseThrow(() -> AccountNotFound.of(id))
                .changePassword(passwordHasher.hash(newPassword), Instant.now(clock));
    }
}
