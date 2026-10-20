package com.moonkage.identity.dto.response;

import com.moonkage.identity.enums.Role;
import lombok.Builder;

/** The logged-in person's account and display profile: GET /api/accounts/me. */
@Builder
public record AccountResponse(String accountId, String email, String phoneNumber, String fullName, Role role) {}
