package com.moonkage.storage;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * MinIO settings shared by every service that owns files (Software Design 5.1 rule 5). Each service sets all of
 * them in its application.yml from the repo-root .env (see .env.example); a missing one stops the service at startup.
 *
 * @param internalUrl how the service reaches MinIO (inside Docker: http://minio:9000)
 * @param browserUrl how a browser reaches MinIO; public file URLs and presigned links use this host
 * @param region fixed so the SDK never looks it up: signing would call MinIO through the browser URL, which the
 *     container cannot reach, and the lookup (GetBucketLocation) is not granted to the service's user
 * @param publicBucketName anonymously readable bucket (product images)
 * @param privateBucketName bucket opened only through presigned links; also holds unconfirmed uploads
 * @param accessKey this service's own MinIO user, created by infra/minio/init.sh; never the root account
 * @param tempKeyPrefix key prefix of this service's unconfirmed uploads in the private bucket, e.g. tmp/catalog;
 *     must match the prefix infra/minio/init.sh grants this service (a lifecycle rule there removes old uploads)
 * @param uploadLinkLifetime how long a presigned POST upload stays valid
 * @param downloadLinkLifetime how long a presigned GET stays valid
 */
@Validated
@ConfigurationProperties("storage")
public record StorageProperties(
        @NotBlank String internalUrl,
        @NotBlank String browserUrl,
        @NotBlank String accessKey,
        @NotBlank String secretKey,
        @NotBlank String region,
        @NotBlank String publicBucketName,
        @NotBlank String privateBucketName,
        @NotBlank String tempKeyPrefix,
        @NotNull Duration uploadLinkLifetime,
        @NotNull Duration downloadLinkLifetime) {}
