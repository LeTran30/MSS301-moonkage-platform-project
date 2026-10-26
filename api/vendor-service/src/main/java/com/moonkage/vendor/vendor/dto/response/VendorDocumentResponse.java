package com.moonkage.vendor.vendor.dto.response;

import com.moonkage.vendor.vendor.DocumentKind;
import java.time.Instant;

/** A document of a vendor; open it with GET /api/vendors/{vendorId}/documents/{id} (AC-27.6). */
public record VendorDocumentResponse(String id, DocumentKind kind, Instant uploadedAt) {}
