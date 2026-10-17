package com.bake2b.identity.dto.response;

import java.time.Instant;

public record ErrorResponse(int status, String error, String message, String path, Instant timestamp) {}
