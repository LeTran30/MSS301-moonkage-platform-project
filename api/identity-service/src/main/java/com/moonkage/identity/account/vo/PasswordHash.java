package com.moonkage.identity.account.vo;

import java.io.Serializable;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Value Object representing a BCrypt hashed password.
 * Protects against accidental logging and serialization.
 */
public record PasswordHash(String hash) implements Serializable {

    public PasswordHash {
        if (hash == null || hash.isBlank()) {
            throw new IllegalArgumentException("Password hash must not be blank");
        }
        hash = hash.trim();
        if (!hash.startsWith("$2a$") && !hash.startsWith("$2b$") && !hash.startsWith("$2y$")) {
            throw new IllegalArgumentException("Password hash must be a valid BCrypt hash");
        }
    }

    public static PasswordHash of(String hash) {
        return new PasswordHash(hash);
    }

    public static PasswordHash fromRawPassword(String rawPassword, PasswordEncoder encoder) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Raw password must not be blank");
        }
        return new PasswordHash(encoder.encode(rawPassword));
    }

    public boolean matches(String rawPassword, PasswordEncoder encoder) {
        return encoder.matches(rawPassword, hash);
    }

    @Override
    public String toString() {
        return "[PROTECTED]";
    }
}
