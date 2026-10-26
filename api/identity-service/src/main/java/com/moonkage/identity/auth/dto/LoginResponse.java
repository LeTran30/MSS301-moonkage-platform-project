package com.moonkage.identity.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.moonkage.identity.account.Role;
import com.moonkage.identity.security.SecurityConstant;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(
        String token,
        String refreshToken,
        String accountId,
        String email,
        String phoneNumber,
        String fullName,
        Role role) {

    @Override
    public String toString() {
        return "LoginResponse[token=" + SecurityConstant.REDACTED + ", refreshToken=" + SecurityConstant.REDACTED
                + ", accountId=" + accountId + ", email=" + email + ", phoneNumber=" + phoneNumber + ", fullName="
                + fullName + ", role=" + role + "]";
    }
}
