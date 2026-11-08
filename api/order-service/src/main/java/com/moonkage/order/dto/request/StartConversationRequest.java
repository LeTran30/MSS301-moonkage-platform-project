package com.moonkage.order.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** "Nhắn shop": the buyer's one conversation with this Shop, opened if it does not exist yet. */
public record StartConversationRequest(
        @NotBlank @Size(max = 36) String vendorId) {}
