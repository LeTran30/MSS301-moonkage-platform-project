package com.moonkage.catalog.exception;

import lombok.Getter;

@Getter
public class CatalogException extends RuntimeException {
    private final CatalogErrorCode errorCode;

    public CatalogException(CatalogErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
