package com.moonkage.catalog.config;

import com.moonkage.storage.FileLimit;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

/** Which files a Shop may upload as product images (catalog.product-image in application.yml). */
@Validated
@ConfigurationProperties("catalog.product-image")
public record ProductImageProperties(
        @NotEmpty Set<String> allowedContentTypes, @NotNull DataSize maxSize) {

    public FileLimit toFileLimit() {
        return new FileLimit(allowedContentTypes, maxSize);
    }
}
