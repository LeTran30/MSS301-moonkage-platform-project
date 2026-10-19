package com.moonkage.storage;

import lombok.Getter;

/** The client sent a file or object key that is not acceptable; services answer 400 with the localized message. */
@Getter
public class InvalidFileException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final StorageErrorCode errorCode;

    /** Fill the {0}, {1}… of the message; Strings and numbers only. */
    @SuppressWarnings("serial")
    private final Object[] messageArgs;

    public InvalidFileException(StorageErrorCode errorCode, Object... messageArgs) {
        super(errorCode.getMessageKey());
        this.errorCode = errorCode;
        this.messageArgs = messageArgs;
    }
}
