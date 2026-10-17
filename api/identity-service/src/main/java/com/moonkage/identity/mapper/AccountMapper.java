package com.moonkage.identity.mapper;

import com.moonkage.identity.dto.response.AccountCreateResponse;
import com.moonkage.identity.entity.Account;

/** Entity → DTO for accounts. DTOs must not depend on entities (ArchitectureTest). */
public final class AccountMapper {

    private AccountMapper() {}

    /** {@code otpSent} is left null; register sets it after trying to send the email. */
    public static AccountCreateResponse toCreateResponse(Account account) {
        return AccountCreateResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .phoneNumber(account.getPhoneNumber())
                .status(account.getStatus().name())
                .build();
    }
}
