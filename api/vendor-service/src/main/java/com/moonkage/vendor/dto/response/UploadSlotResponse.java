package com.moonkage.vendor.dto.response;

/** Presigned upload; the client then sends {@code objectKey} in the body that creates or updates the resource. */
public record UploadSlotResponse(String objectKey, String url) {}
