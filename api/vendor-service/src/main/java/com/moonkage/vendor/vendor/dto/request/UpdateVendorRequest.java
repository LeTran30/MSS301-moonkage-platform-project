package com.moonkage.vendor.vendor.dto.request;

/**
 * Partial update. The seller sends {@code localDeliveryFee} (FR-28); the admin sends {@code status = LOCKED} with
 * {@code statusReason} (FR-46).
 */
public record UpdateVendorRequest(Long localDeliveryFee, String status, String statusReason) {}
