package com.moonkage.identity.profile.dto;

/**
 * GET /internal/accounts/{accountId}/contact: where to email an account, for services that notify it (payment-service
 * wallet refunds). Holds an email: callers must not log it (NFR-03).
 */
public record AccountContactResponse(String accountId, String fullName, String email) {}
