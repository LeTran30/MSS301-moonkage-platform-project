package com.moonkage.storage;

import java.util.Map;
import java.util.Optional;

/** File extension of each content type the platform stores. The object extension never comes from the client's name. */
public final class ContentTypeExtensions {

    public static final Map<String, String> BY_CONTENT_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "application/pdf", ".pdf");

    private ContentTypeExtensions() {}

    /** Reverse lookup of {@link #BY_CONTENT_TYPE}. */
    public static Optional<String> findContentType(String extension) {
        return BY_CONTENT_TYPE.entrySet().stream()
                .filter(e -> e.getValue().equals(extension))
                .map(Map.Entry::getKey)
                .findFirst();
    }
}
