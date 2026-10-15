package com.bake2b.catalog.common.exception;

import java.time.Instant;

public record ErrorResponse(int status, String error, String message, String path, Instant timestamp) {}
