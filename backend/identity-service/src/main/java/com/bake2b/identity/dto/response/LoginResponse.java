package com.bake2b.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {

    private String token;
    private String refreshToken;
    private String accountId;
    private String userId;
    private String email;
    private String phoneNumber;
    private String fullName;
    private String role;
    /** Vendor profile status of this account (FR-27): NONE, PENDING, NEEDS_INFO, APPROVED, REJECTED, LOCKED. */
    private String vendorStatus;
    private String vendorId;
}
