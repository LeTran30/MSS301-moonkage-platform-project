package com.moonkage.quotation.dto.request;

import com.moonkage.quotation.enums.InvitationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * The vendor's answer to a request: only DECLINED, with a reason (AC-36.3). Quoting is POST .../quotes.
 */
public record UpdateInvitationRequest(
        @NotNull InvitationStatus status, @Size(max = 1000) String declineReason) {}
