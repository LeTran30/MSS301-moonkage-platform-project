package com.moonkage.order.config;

import com.moonkage.storage.FileLimit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

/**
 * Files of an order: mockups, progress photos, the vendor's invoice, dispute evidence (order.file in
 * application.yml, NFR-08). All private: read through presigned links only.
 *
 * @param keyPrefix prefix of confirmed files in the private bucket; must match the prefix infra/minio/init.sh grants
 *     order-service. Each order's files go under {@code <keyPrefix>/<orderId>}.
 */
@Validated
@ConfigurationProperties("order.file")
public record OrderFileProperties(
        @NotEmpty Set<String> allowedContentTypes,
        @NotNull DataSize maxSize,
        @NotBlank String keyPrefix) {

    public FileLimit toFileLimit() {
        return new FileLimit(allowedContentTypes, maxSize);
    }

    public String keyPrefixOf(String orderId) {
        return keyPrefix + "/" + orderId;
    }
}
