package com.moonkage.vendor.vendor.dto.response;

import java.time.Instant;

public record VendorDocumentResponse(String id, String kind, Instant uploadedAt) {}
