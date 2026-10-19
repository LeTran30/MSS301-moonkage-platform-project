package com.moonkage.storage;

/** MinIO could not be reached or refused the call; services answer 5xx. */
public class StorageUnavailableException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public StorageUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
