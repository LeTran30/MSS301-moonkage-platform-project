package com.moonkage.identity.account.application.port;

import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.account.domain.PasswordHash;

/** Turns a password into what is stored, and checks one against it. The only place that knows the algorithm. */
public interface PasswordHasher {

    PasswordHash hash(RawPassword password);

    boolean matches(RawPassword password, PasswordHash hash);

    /**
     * Spends the time of one {@link #matches} on a hash nobody has, for a login without an account: the reply then
     * takes as long as for a wrong password, so timing does not reveal that an account exists (FR-02).
     */
    void dummyMatch(RawPassword password);
}
