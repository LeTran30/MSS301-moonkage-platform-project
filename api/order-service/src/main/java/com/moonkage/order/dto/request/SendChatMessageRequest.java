package com.moonkage.order.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

/**
 * A chat message: text, a file sent first through POST /api/orders/uploads, or both.
 *
 * @param attachmentTempKey from POST /api/orders/uploads, after the file reached MinIO
 * @param attachmentName the file name to show, as the person picked it
 */
public record SendChatMessageRequest(
        @Size(max = 2000) String body,
        @Size(max = 255) String attachmentTempKey,
        @Size(max = 255) String attachmentName) {

    public SendChatMessageRequest {
        body = body == null || body.isBlank() ? null : body.strip();
        attachmentTempKey = attachmentTempKey == null || attachmentTempKey.isBlank() ? null : attachmentTempKey.trim();
        attachmentName = attachmentName == null || attachmentName.isBlank() ? null : attachmentName.trim();
    }

    @AssertTrue(message = "a message needs text or a file")
    public boolean isNotEmpty() {
        return body != null || attachmentTempKey != null;
    }
}
