package com.moonkage.identity.account.atom;

import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import java.io.Serializable;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Value Object representing a BCrypt hashed password.
 * Protects against accidental logging and serialization. A wrong value answers INVALID_INPUT like every other value
 * object, never a 500.
 */
public record PasswordHash(String hash) implements Serializable {

    private static final String PASSWORD_FIELD = "password";

    public PasswordHash {
        if (hash == null || hash.isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        hash = hash.trim();
        if (!hash.startsWith("$2a$") && !hash.startsWith("$2b$") && !hash.startsWith("$2y$")) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
    }

    public static PasswordHash of(String hash) {
        return new PasswordHash(hash);
    }

    /** Throws INVALID_INPUT for a blank password or one outside the {@link PasswordConstant} limits. */
    public static PasswordHash fromRawPassword(String rawPassword, PasswordEncoder encoder) {
        if (rawPassword == null
                || rawPassword.isBlank()
                || rawPassword.length() < PasswordConstant.MIN_LENGTH
                || rawPassword.length() > PasswordConstant.MAX_LENGTH) {
            throw new AppException(ErrorCode.INVALID_INPUT, PASSWORD_FIELD);
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
