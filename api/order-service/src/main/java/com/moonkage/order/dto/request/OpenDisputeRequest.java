package com.moonkage.order.dto.request;

import com.moonkage.order.enums.DisputeReason;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/** FR-12: reason, what happened, and photos (each uploaded first through POST /api/orders/uploads). */
public record OpenDisputeRequest(
        @NotNull DisputeReason reason,
        @NotBlank @Size(max = 2000) String description,
        @Valid @Size(max = MAX_EVIDENCES) List<EvidenceRequest> evidences) {

    public static final int MAX_EVIDENCES = 10;
}
