package com.moonkage.storage;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Errors of the storage library. Texts live in storage-messages.properties; a service resolves them by adding
 * {@code storage-messages} to {@code spring.messages.basename}.
 */
@Getter
@RequiredArgsConstructor
public enum StorageErrorCode {
    INVALID_KEY("STORAGE_001", "error.storage.invalid_key"),
    NOT_UPLOADED("STORAGE_002", "error.storage.not_uploaded"),
    TYPE_MISMATCH("STORAGE_003", "error.storage.type_mismatch"),
    /** Arg {0}: allowed content types. */
    TYPE_NOT_ALLOWED("STORAGE_004", "error.storage.type_not_allowed"),
    EMPTY_FILE("STORAGE_005", "error.storage.empty_file"),
    /** Arg {0}: limit in MB. */
    FILE_TOO_LARGE("STORAGE_006", "error.storage.file_too_large"),
    /** The bytes are not a file of the declared type (magic number or structure). */
    CONTENT_MISMATCH("STORAGE_007", "error.storage.content_mismatch"),
    UNAVAILABLE("STORAGE_503", "error.storage.unavailable");

    private final String code;
    private final String messageKey;
}
