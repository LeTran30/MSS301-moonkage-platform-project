package com.moonkage.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

/**
 * Answer of POST /register and /verify.
 *
 * @param verified e-mail confirmed: false after /register, true after /verify-account
 * @param otpSent register only: false when the confirmation email could not be sent, client offers "resend code"
 *     (FR-01)
 */
@Builder
public record RegisterAccountResponse(
        String id,
        String email,
        String phoneNumber,
        boolean verified,
        @JsonInclude(JsonInclude.Include.NON_NULL) Boolean otpSent) {}
