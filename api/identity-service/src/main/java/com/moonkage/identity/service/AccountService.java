package com.moonkage.identity.service;

import com.moonkage.identity.dto.response.AccountRefResponse;
import java.util.Optional;

public interface AccountService {

    /** Email is trimmed and lower-cased before lookup. Empty when no account has it. */
    Optional<AccountRefResponse> findRefByEmail(String email);
}
