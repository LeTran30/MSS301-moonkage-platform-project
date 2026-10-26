package com.moonkage.vendor.vendor.dto.request;

/** Admin attaches the registration fee invoice, {@code kind = FEE_INVOICE} (Q-36). */
public record CreateVendorDocumentRequest(String kind, String objectKey) {}
