package com.moonkage.vendor.dto.response;

import java.time.Instant;

/** Short-lived link to a document in the private bucket (AC-27.6). */
public record VendorDocumentLinkResponse(String url, Instant expiresAt) {}
