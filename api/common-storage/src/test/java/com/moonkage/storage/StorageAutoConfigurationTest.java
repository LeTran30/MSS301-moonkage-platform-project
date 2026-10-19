package com.moonkage.storage;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class StorageAutoConfigurationTest {

    private static final String[] ALL_SETTINGS = {
        "storage.internal-url=http://minio:9000",
        "storage.browser-url=http://localhost:9000",
        "storage.access-key=key",
        "storage.secret-key=secret",
        "storage.region=us-east-1",
        "storage.public-bucket-name=pub",
        "storage.private-bucket-name=priv",
        "storage.temp-key-prefix=tmp",
        "storage.upload-link-lifetime=10m",
        "storage.download-link-lifetime=10m"
    };

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(
                    AutoConfigurations.of(StorageAutoConfiguration.class, ValidationAutoConfiguration.class));

    @Test
    void startsWhenEverySettingIsPresent() {
        runner.withPropertyValues(ALL_SETTINGS)
                .run(context -> assertThat(context).hasNotFailed().hasSingleBean(ObjectStorage.class));
    }

    @Test
    void failsAtStartupWhenBrowserUrlIsMissing() {
        String[] withoutBrowserUrl = Arrays.stream(ALL_SETTINGS)
                .filter(s -> !s.startsWith("storage.browser-url="))
                .toArray(String[]::new);

        runner.withPropertyValues(withoutBrowserUrl)
                .run(context -> assertThat(context).hasFailed().getFailure().hasStackTraceContaining("browserUrl"));
    }

    @Test
    void failsAtStartupWhenTheServiceUserIsBlank() {
        runner.withPropertyValues(ALL_SETTINGS)
                .withPropertyValues("storage.access-key= ")
                .run(context -> assertThat(context).hasFailed().getFailure().hasStackTraceContaining("accessKey"));
    }
}
