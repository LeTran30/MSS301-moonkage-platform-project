package com.moonkage.storage;

import io.minio.MinioClient;
import java.time.Clock;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

/** Active in every service that depends on common-storage; configure it under {@code storage.*}. */
@AutoConfiguration
@EnableConfigurationProperties(StorageProperties.class)
public class StorageAutoConfiguration {

    @Bean
    public ObjectStorage objectStorage(StorageProperties properties) {
        // a fixed region also stops the SDK from asking GetBucketLocation, which the service's user may not do
        MinioClient internalClient = MinioClient.builder()
                .endpoint(properties.internalUrl())
                .region(properties.region())
                .credentials(properties.accessKey(), properties.secretKey())
                .build();
        MinioClient browserUrlSigner = MinioClient.builder()
                .endpoint(properties.browserUrl())
                .region(properties.region())
                .credentials(properties.accessKey(), properties.secretKey())
                .build();
        return new ObjectStorage(properties, internalClient, browserUrlSigner, Clock.systemUTC());
    }

    @Bean
    public ApplicationRunner verifyStorageAccess(ObjectStorage objectStorage) {
        return args -> objectStorage.verifyPrivateBucketAccess();
    }
}
