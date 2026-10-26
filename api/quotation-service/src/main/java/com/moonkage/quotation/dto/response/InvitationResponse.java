package com.moonkage.quotation.dto.response;

import com.moonkage.quotation.enums.InvitationStatus;
import java.time.Instant;

public record InvitationResponse(
        String vendorId, String vendorName, InvitationStatus status, String declineReason, Instant respondedAt) {}
