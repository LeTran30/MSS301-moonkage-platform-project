package com.moonkage.identity.dto.response;

/** Minimal account reference for other services (OpenFeign); vendor-service reads {@code accountId}. */
public record AccountRefResponse(String accountId) {}
