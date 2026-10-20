package com.moonkage.identity.dto.response;

import lombok.Builder;

/**
 * Answer of POST /verify-account.
 *
 * @param verified e-mail confirmed: always true here, kept so the client reads the same field as after /register
 */
@Builder
public record VerifyAccountResponse(String id, String email, String phoneNumber, boolean verified) {}
