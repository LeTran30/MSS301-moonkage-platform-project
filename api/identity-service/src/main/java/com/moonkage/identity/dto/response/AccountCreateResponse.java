package com.moonkage.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountCreateResponse {

    private String id;
    private String email;
    private String phoneNumber;
    private String status;

    /** Register only: false when the confirmation email could not be sent, client offers "resend code" (FR-01). */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean otpSent;
}
