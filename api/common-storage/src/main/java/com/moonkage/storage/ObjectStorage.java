package com.moonkage.storage;

import io.minio.GetObjectArgs;
import io.minio.GetObjectResponse;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PostPolicy;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.errors.ErrorResponseException;
import io.minio.http.Method;
import java.io.ByteArrayInputStream;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;

/**
 * Two-step upload straight between the client and MinIO (Software Design 5.1 rule 5, section 8): the client POSTs the
 * file to MinIO under a signed policy, then the owning service checks it and moves it to its final key. Flow and
 * invariants: docs/classes/ObjectStorage.md.
 *
 * <p>Object names are {@code <keyPrefix>/<uuid>.<ext>}: no account id or personal data, so who may see a file is
 * decided by the owning service's records, not by its path.
 */
@Slf4j
public class ObjectStorage {

    /** File part of every key this class creates: {@code <uuid>.<ext>} (Software Design 8: object names are UUIDs). */
    private static final Pattern UUID_FILE_NAME_PATTERN =
            Pattern.compile("[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\\.[a-z]+");
    /** S3 error code for a missing object. */
    private static final String NO_SUCH_KEY_ERROR_CODE = "NoSuchKey";
    /** Key looked up at startup to prove access; it never exists, so MinIO answers NoSuchKey when all is well. */
    private static final String ACCESS_PROBE_FILE_NAME = ".access-probe";

    private static final String ALLOWED_TYPES_SEPARATOR = ", ";
    /** Form fields of an S3 browser POST upload; the client sends them back unchanged. */
    private static final String POST_KEY_FIELD = "key";

    private static final String POST_CONTENT_TYPE_FIELD = "Content-Type";
    /** Smallest upload the POST policy accepts; empty files are refused. */
    private static final long MIN_UPLOAD_BYTES = 1;

    private final StorageProperties properties;
    /** Talks to MinIO through its internal URL, from inside the service network. */
    private final MinioClient internalClient;
    /** Only signs links; uses the browser URL because the signature covers the host. */
    private final MinioClient browserUrlSigner;

    private final Clock clock;

    public ObjectStorage(
            StorageProperties properties, MinioClient internalClient, MinioClient browserUrlSigner, Clock clock) {
        this.properties = properties;
        this.internalClient = internalClient;
        this.browserUrlSigner = browserUrlSigner;
        this.clock = clock;
    }

    /**
     * Call only after the owning service's permission check: whoever holds the link can upload. The signed policy
     * makes MinIO itself refuse another key, another Content-Type or more bytes than sizeBytes.
     */
    public PresignedUploadLink createPresignedUploadLink(String contentType, long sizeBytes, FileLimit limit) {
        validateTypeAndSize(contentType, sizeBytes, limit);
        String tempKey = properties.tempKeyPrefix() + "/" + UUID.randomUUID()
                + ContentTypeExtensions.BY_CONTENT_TYPE.get(contentType);
        Instant expiresAt = clock.instant().plus(properties.uploadLinkLifetime());
        Map<String, String> formFields = signPostPolicy(tempKey, contentType, sizeBytes, expiresAt);
        return new PresignedUploadLink(tempKey, toBucketUrl(properties.privateBucketName()), formFields, expiresAt);
    }

    /**
     * Checks a key from {@link #createPresignedUploadLink} (type, size, magic bytes) and moves it to
     * {@code <keyPrefix>/<same file name>} in the target bucket, with image metadata (EXIF, GPS…) removed on the way.
     * The file, at most limit.maxSize, is read into memory once for this. A file that fails a check is deleted, so it
     * cannot be retried with a looser limit.
     *
     * @return the final object key, to store in the owning service
     */
    public String moveUploadedFile(String tempKey, FileLimit limit, BucketAccess targetAccess, String keyPrefix) {
        String fileName = getTempFileName(tempKey);
        ObjectMetadata uploadedMetadata = findMetadata(properties.privateBucketName(), tempKey)
                .orElseThrow(() -> new InvalidFileException(StorageErrorCode.NOT_UPLOADED));
        byte[] cleanedContent;
        try {
            validateUploadedObject(fileName, uploadedMetadata, limit);
            byte[] content = readObject(properties.privateBucketName(), tempKey);
            validateSignature(uploadedMetadata.contentType(), content);
            cleanedContent = ImageMetadataStripper.removeMetadata(uploadedMetadata.contentType(), content);
        } catch (InvalidFileException e) {
            removeQuietly(properties.privateBucketName(), tempKey);
            throw e;
        }

        String finalKey = keyPrefix + "/" + fileName;
        writeObject(toBucketName(targetAccess), finalKey, cleanedContent, uploadedMetadata.contentType());
        removeQuietly(properties.privateBucketName(), tempKey);
        return finalKey;
    }

    /** True for keys still waiting for {@link #moveUploadedFile}. */
    public boolean isTempKey(String key) {
        return key != null && key.startsWith(properties.tempKeyPrefix() + "/");
    }

    /** Permanent URL of a file in the public bucket. */
    public String toPublicUrl(String key) {
        return toBucketUrl(properties.publicBucketName()) + "/" + key;
    }

    /** Short-lived link to a file in the private bucket; call it only after the caller's permission check. */
    public String createPresignedDownloadUrl(String key) {
        return signGetUrl(properties.privateBucketName(), key, properties.downloadLinkLifetime());
    }

    /** Missing objects are ignored, so it is safe to call after the record is gone. */
    public void deleteQuietly(BucketAccess access, String key) {
        removeQuietly(toBucketName(access), key);
    }

    /**
     * Fails startup unless this service's MinIO user can read its temp prefix in the private bucket: a missing bucket,
     * wrong credentials or a missing policy all show up here instead of on the first upload. Buckets, policies and
     * users are created by minio/init.sh, never by a service.
     */
    public void verifyPrivateBucketAccess() {
        String probeKey = properties.tempKeyPrefix() + "/" + ACCESS_PROBE_FILE_NAME;
        try {
            findMetadata(properties.privateBucketName(), probeKey);
        } catch (StorageUnavailableException e) {
            throw new StorageUnavailableException(
                    "MinIO user " + properties.accessKey() + " cannot read " + properties.privateBucketName() + "/"
                            + properties.tempKeyPrefix()
                            + "/; check the storage.* settings and that minio-init has run",
                    e);
        }
        log.info("MinIO access to {}/{}/ verified", properties.privateBucketName(), properties.tempKeyPrefix());
    }

    private static void validateTypeAndSize(String contentType, long sizeBytes, FileLimit limit) {
        if (contentType == null || !limit.allowedContentTypes().contains(contentType)) {
            throw new InvalidFileException(
                    StorageErrorCode.TYPE_NOT_ALLOWED,
                    String.join(ALLOWED_TYPES_SEPARATOR, limit.allowedContentTypes()));
        }
        if (sizeBytes <= 0) {
            throw new InvalidFileException(StorageErrorCode.EMPTY_FILE);
        }
        if (sizeBytes > limit.maxSize().toBytes()) {
            throw new InvalidFileException(
                    StorageErrorCode.FILE_TOO_LARGE, limit.maxSize().toMegabytes());
        }
    }

    /** Form fields the client must send with the file; the policy covers key, Content-Type and size. */
    private Map<String, String> signPostPolicy(String tempKey, String contentType, long sizeBytes, Instant expiresAt) {
        PostPolicy policy =
                new PostPolicy(properties.privateBucketName(), ZonedDateTime.ofInstant(expiresAt, ZoneOffset.UTC));
        policy.addEqualsCondition(POST_KEY_FIELD, tempKey);
        policy.addEqualsCondition(POST_CONTENT_TYPE_FIELD, contentType);
        policy.addContentLengthRangeCondition(MIN_UPLOAD_BYTES, sizeBytes);
        try {
            Map<String, String> formFields = new LinkedHashMap<>(browserUrlSigner.getPresignedPostFormData(policy));
            formFields.put(POST_KEY_FIELD, tempKey);
            formFields.put(POST_CONTENT_TYPE_FIELD, contentType);
            return Collections.unmodifiableMap(formFields);
        } catch (Exception e) {
            throw new StorageUnavailableException("Failed to sign upload policy for " + tempKey, e);
        }
    }

    /** Bucket URL as a browser reaches it; also the target of a POST upload. */
    private String toBucketUrl(String bucketName) {
        String browserUrl = properties.browserUrl().endsWith("/")
                ? properties.browserUrl().substring(0, properties.browserUrl().length() - 1)
                : properties.browserUrl();
        return browserUrl + "/" + bucketName;
    }

    private String signGetUrl(String bucketName, String key, Duration lifetime) {
        try {
            return browserUrlSigner.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucketName)
                    .object(key)
                    .expiry(Math.toIntExact(lifetime.toSeconds()))
                    .build());
        } catch (Exception e) {
            throw new StorageUnavailableException("Failed to sign " + bucketName + "/" + key, e);
        }
    }

    /** Rejects anything but {@code <tempKeyPrefix>/<uuid>.<ext>}, so a client cannot point at someone else's object. */
    private String getTempFileName(String tempKey) {
        if (!isTempKey(tempKey)) {
            throw new InvalidFileException(StorageErrorCode.INVALID_KEY);
        }
        String fileName = tempKey.substring(properties.tempKeyPrefix().length() + 1);
        if (!UUID_FILE_NAME_PATTERN.matcher(fileName).matches()) {
            throw new InvalidFileException(StorageErrorCode.INVALID_KEY);
        }
        return fileName;
    }

    private Optional<ObjectMetadata> findMetadata(String bucketName, String key) {
        try {
            StatObjectResponse stat = internalClient.statObject(
                    StatObjectArgs.builder().bucket(bucketName).object(key).build());
            return Optional.of(new ObjectMetadata(stat.contentType(), stat.size()));
        } catch (ErrorResponseException e) {
            if (NO_SUCH_KEY_ERROR_CODE.equals(e.errorResponse().code())) {
                return Optional.empty();
            }
            throw new StorageUnavailableException("Failed to read " + bucketName + "/" + key, e);
        } catch (Exception e) {
            throw new StorageUnavailableException("Failed to read " + bucketName + "/" + key, e);
        }
    }

    /**
     * The POST policy already binds Content-Type and size; they are checked again on what was really stored, so a
     * policy mistake cannot let a file through. The type must also match the extension chosen for the key.
     */
    private static void validateUploadedObject(String fileName, ObjectMetadata uploadedMetadata, FileLimit limit) {
        Optional<String> declaredContentType =
                ContentTypeExtensions.findContentType(fileName.substring(fileName.lastIndexOf('.')));
        if (declaredContentType.filter(uploadedMetadata.contentType()::equals).isEmpty()) {
            throw new InvalidFileException(StorageErrorCode.TYPE_MISMATCH);
        }
        validateTypeAndSize(uploadedMetadata.contentType(), uploadedMetadata.sizeBytes(), limit);
    }

    private void removeQuietly(String bucketName, String key) {
        try {
            internalClient.removeObject(
                    RemoveObjectArgs.builder().bucket(bucketName).object(key).build());
        } catch (Exception e) {
            // a leftover object only costs space; the business change must not fail because of it
            log.warn("Failed to delete {}/{}", bucketName, key, e);
        }
    }

    private String toBucketName(BucketAccess access) {
        return access == BucketAccess.PUBLIC ? properties.publicBucketName() : properties.privateBucketName();
    }

    private byte[] readObject(String bucketName, String key) {
        try (GetObjectResponse object = internalClient.getObject(
                GetObjectArgs.builder().bucket(bucketName).object(key).build())) {
            return object.readAllBytes();
        } catch (Exception e) {
            throw new StorageUnavailableException("Failed to read " + bucketName + "/" + key, e);
        }
    }

    /** Magic bytes: an HTML page or script sent as image/png is refused here. */
    private static void validateSignature(String contentType, byte[] content) {
        if (!FileSignatures.hasSignature(contentType, content)) {
            throw new InvalidFileException(StorageErrorCode.CONTENT_MISMATCH);
        }
    }

    private void writeObject(String bucketName, String key, byte[] content, String contentType) {
        try {
            internalClient.putObject(PutObjectArgs.builder().bucket(bucketName).object(key).stream(
                            new ByteArrayInputStream(content), content.length, -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            throw new StorageUnavailableException("Failed to write " + bucketName + "/" + key, e);
        }
    }

    private record ObjectMetadata(String contentType, long sizeBytes) {}
}
