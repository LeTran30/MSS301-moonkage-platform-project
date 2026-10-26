package com.moonkage.vendor.vendor;

import com.moonkage.storage.FileLimit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

/**
 * Which files an owner may upload as legal documents, and where they are kept (vendor.document in application.yml).
 *
 * @param keyPrefix prefix of confirmed documents in the private bucket; must match the prefix infra/minio/init.sh
 *     grants vendor-service. Each vendor's files go under {@code <keyPrefix>/<vendorId>}.
 */
@Validated
@ConfigurationProperties("vendor.document")
record VendorDocumentProperties(
        @NotEmpty Set<String> allowedContentTypes,
        @NotNull DataSize maxSize,
        @NotBlank String keyPrefix) {

    FileLimit toFileLimit() {
        return new FileLimit(allowedContentTypes, maxSize);
    }

    String keyPrefixOf(String vendorId) {
        return keyPrefix + "/" + vendorId;
    }
}
