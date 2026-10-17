package com.moonkage.file.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Top-level folder in the bucket. Only product images are world-readable;
 * the rest are opened through a short-lived presigned link.
 */
@Getter
@RequiredArgsConstructor
public enum FileFolder {
    PRODUCTS("products", true),
    VENDOR_DOCUMENTS("vendor-documents", false),
    MOCKUPS("mockups", false),
    PROGRESS("progress", false),
    DISPUTES("disputes", false);

    private final String path;
    private final boolean publicRead;

    public static FileFolder fromPath(String path) {
        for (FileFolder f : values()) {
            if (f.path.equals(path)) {
                return f;
            }
        }
        return null;
    }
}
