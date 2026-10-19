package com.moonkage.catalog.dto.response;

import java.time.Instant;
import java.util.Map;

/**
 * Before expiresAt, send a multipart/form-data POST to uploadUrl with every formFields entry as a field, then the
 * image as the last field named "file". MinIO refuses another type or a file larger than the declared size. Then send
 * tempKey in imageKeys of the create/update product request.
 */
public record PresignedUploadLinkResponse(
        String tempKey, String uploadUrl, Map<String, String> formFields, Instant expiresAt) {}
