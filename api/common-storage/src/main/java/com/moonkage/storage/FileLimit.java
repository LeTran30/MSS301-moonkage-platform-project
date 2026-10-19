package com.moonkage.storage;

import java.util.Set;
import org.springframework.util.unit.DataSize;

/**
 * Allowed content types and maximum size for one kind of file, e.g. product images. Each service binds its own
 * from application.yml.
 *
 * @param allowedContentTypes each must be one of {@link ContentTypeExtensions#BY_CONTENT_TYPE}
 */
public record FileLimit(Set<String> allowedContentTypes, DataSize maxSize) {

    public FileLimit {
        allowedContentTypes = Set.copyOf(allowedContentTypes);
        for (String contentType : allowedContentTypes) {
            if (!ContentTypeExtensions.BY_CONTENT_TYPE.containsKey(contentType)) {
                throw new IllegalArgumentException("No file extension known for content type " + contentType);
            }
        }
    }
}
