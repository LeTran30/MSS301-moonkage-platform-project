package com.moonkage.vendor.product;

import com.moonkage.storage.FileLimit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

/**
 * Which files a Shop may upload as product images, and where they are kept (vendor.product-image in
 * application.yml).
 *
 * @param keyPrefix prefix of confirmed images in the public bucket; must match the prefix infra/minio/init.sh grants
 *     vendor-service. Each vendor's images go under {@code <keyPrefix>/<vendorId>}.
 */
@Validated
@ConfigurationProperties("vendor.product-image")
record ProductImageProperties(
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
