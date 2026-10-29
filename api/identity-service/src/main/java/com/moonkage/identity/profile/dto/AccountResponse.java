package com.moonkage.identity.profile.dto;

import com.moonkage.identity.shared.Role;
import lombok.Builder;

/** The logged-in person's account and display profile: GET /api/accounts/me. */
@Builder
public record AccountResponse(String accountId, String email, String phoneNumber, String fullName, Role role) {}
