package com.moonkage.order.service;

import com.moonkage.order.config.OrderFileProperties;
import com.moonkage.order.dto.request.FileUploadRequest;
import com.moonkage.order.dto.response.PresignedUploadLinkResponse;
import com.moonkage.storage.BucketAccess;
import com.moonkage.storage.ObjectStorage;
import com.moonkage.storage.PresignedUploadLink;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

/** Uploads straight to MinIO and the private keys of an order's files (common-storage, NFR-08). */
@Component
@RequiredArgsConstructor
@EnableConfigurationProperties(OrderFileProperties.class)
public class OrderFileService {

    private final ObjectStorage objectStorage;
    private final OrderFileProperties properties;

    public PresignedUploadLinkResponse createUploadLink(FileUploadRequest request) {
        PresignedUploadLink link = objectStorage.createPresignedUploadLink(
                request.contentType(), request.sizeBytes(), properties.toFileLimit());
        return new PresignedUploadLinkResponse(link.tempKey(), link.uploadUrl(), link.formFields(), link.expiresAt());
    }

    /**
     * Checks an uploaded file and moves it under the order (InvalidFileException when it is not there, too large or
     * not what it claims to be).
     *
     * @return the object key to keep
     */
    public String attach(String orderId, String tempKey) {
        return objectStorage.moveUploadedFile(
                tempKey, properties.toFileLimit(), BucketAccess.PRIVATE, properties.keyPrefixOf(orderId));
    }

    /** A short-lived link to read a private file; null for no key. */
    public String downloadUrl(String objectKey) {
        return objectKey == null ? null : objectStorage.createPresignedDownloadUrl(objectKey);
    }
}
