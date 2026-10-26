package com.moonkage.vendor.vendor.dto.response;

import java.time.Instant;
import java.util.Map;

/**
 * Before expiresAt, send a multipart/form-data POST to uploadUrl with every formFields entry as a field, then the
 * file as the last field named "file". Then send tempKey as a document's objectKey when submitting the profile.
 */
public record PresignedUploadLinkResponse(
        String tempKey, String uploadUrl, Map<String, String> formFields, Instant expiresAt) {}
