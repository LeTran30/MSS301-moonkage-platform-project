package com.moonkage.order.client.dto;

/** identity-service GET /internal/accounts/{accountId}/name. */
public record AccountNameView(String accountId, String fullName) {}
