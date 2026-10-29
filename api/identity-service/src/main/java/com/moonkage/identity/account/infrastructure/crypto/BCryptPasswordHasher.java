package com.moonkage.identity.account.infrastructure.crypto;

import com.moonkage.identity.account.RawPassword;
import com.moonkage.identity.account.application.port.PasswordHasher;
import com.moonkage.identity.account.domain.PasswordHash;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.keygen.KeyGenerators;
import org.springframework.stereotype.Component;

/** BCrypt with the library's default strength, as every stored hash was made. */
@Component
class BCryptPasswordHasher implements PasswordHasher {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /** Hash of a random password drawn at start-up: no one can type it, and checking it costs a real check. */
    private final String dummyHash = encoder.encode(KeyGenerators.string().generateKey());

    @Override
    public PasswordHash hash(RawPassword password) {
        return new PasswordHash(encoder.encode(password.value()));
    }

    @Override
    public boolean matches(RawPassword password, PasswordHash hash) {
        return encoder.matches(password.value(), hash.value());
    }

    @Override
    public void dummyMatch(RawPassword password) {
        encoder.matches(password.value(), dummyHash);
    }
}
