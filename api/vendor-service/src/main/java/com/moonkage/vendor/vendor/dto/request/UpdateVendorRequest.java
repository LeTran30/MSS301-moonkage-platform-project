package com.moonkage.vendor.vendor.dto.request;

import com.moonkage.vendor.vendor.VendorStatus;

/**
 * Partial update; each caller sends only its own fields, anything else is refused (403).
 *
 * @param localDeliveryFee the owner: whole VND, 0 or more, per order delivered inside its areas (FR-28, AC-28.3)
 * @param status the admin: only LOCKED (FR-46)
 * @param statusReason the admin: required with LOCKED (AC-46.2)
 */
public record UpdateVendorRequest(Long localDeliveryFee, VendorStatus status, String statusReason) {}
