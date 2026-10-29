package com.moonkage.identity.account.application;

import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.account.application.port.PasswordHasher;
import com.moonkage.identity.account.domain.PasswordHash;

/** A readable stand-in for BCrypt that counts its checks, so a test can see that the dummy check was made. */
final class RecordingPasswordHasher implements PasswordHasher {

    private int matches;
    private int dummyMatches;

    @Override
    public PasswordHash hash(RawPassword password) {
        return new PasswordHash("hashed:" + password.value());
    }

    @Override
    public boolean matches(RawPassword password, PasswordHash hash) {
        matches++;
        return hash.equals(hash(password));
    }

    @Override
    public void dummyMatch(RawPassword password) {
        dummyMatches++;
    }

    int matches() {
        return matches;
    }

    int dummyMatches() {
        return dummyMatches;
    }
}
