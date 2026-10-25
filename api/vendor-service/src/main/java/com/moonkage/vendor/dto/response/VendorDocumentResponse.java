package com.moonkage.vendor.dto.response;

import java.time.Instant;

public record VendorDocumentResponse(String id, String kind, Instant uploadedAt) {}
