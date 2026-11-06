package com.moonkage.order.dto.request;

import jakarta.validation.constraints.PositiveOrZero;

/** @param upToSeq the seq of the newest message the reader has seen */
public record MarkChatReadRequest(@PositiveOrZero long upToSeq) {}
