package com.moonkage.identity.profile.dto;

/** GET /internal/accounts/{accountId}/name: only the display name, nothing private (NFR-03). */
public record AccountNameResponse(String accountId, String fullName) {}
