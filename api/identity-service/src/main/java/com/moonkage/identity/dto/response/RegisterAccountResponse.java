package com.moonkage.identity.dto.response;

import lombok.Builder;

/**
 * Answer of POST /register.
 *
 * @param verified e-mail confirmed: always false right after /register
 * @param otpSent false when the confirmation email could not be sent, client offers "resend code"
 *     (FR-01)
 */
@Builder
public record RegisterAccountResponse(String id, String email, String phoneNumber, boolean verified, boolean otpSent) {}
