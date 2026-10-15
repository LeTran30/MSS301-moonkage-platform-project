package com.bake2b.identity.common.exception;

import java.time.Instant;

public record ErrorResponse(int status, String error, String message, String path, Instant timestamp) {}
