package com.moonkage.storage;

import java.time.Instant;
import java.util.Map;

/**
 * Where and how the client uploads one file: a multipart/form-data POST to uploadUrl with every formFields entry,
 * then the file as the last field named "file", before expiresAt. MinIO refuses a different key, Content-Type or a
 * larger file. Then the client sends tempKey back in the business request (create product, send mockup…).
 */
public record PresignedUploadLink(String tempKey, String uploadUrl, Map<String, String> formFields, Instant expiresAt) {

    public PresignedUploadLink {
        formFields = Map.copyOf(formFields);
    }
}
