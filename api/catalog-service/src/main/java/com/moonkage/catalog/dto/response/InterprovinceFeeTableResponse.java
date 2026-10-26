package com.moonkage.catalog.dto.response;

import java.util.List;

public record InterprovinceFeeTableResponse(List<InterprovinceFeeResponse> fees, boolean complete) {
    public InterprovinceFeeTableResponse {
        fees = List.copyOf(fees);
    }
}
