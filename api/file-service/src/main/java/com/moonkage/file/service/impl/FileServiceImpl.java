package com.moonkage.file.service.impl;

import com.moonkage.file.config.MinIOConfig;
import com.moonkage.file.dto.FileUploadResponse;
import com.moonkage.file.enums.FileFolder;
import com.moonkage.file.service.FileService;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
public class FileServiceImpl implements FileService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final int MAX_FILES = 10;
    private static final int PRESIGNED_MINUTES = 10;
    /** Object names are folder/accountId/fileName. */
    private static final int OBJECT_NAME_PARTS = 3;
    /** Content type comes from the extension, never from the client, so nothing but these types is ever served. */
    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            ".jpg", "image/jpeg",
            ".jpeg", "image/jpeg",
            ".png", "image/png",
            ".webp", "image/webp",
            ".pdf", "application/pdf");

    private final MinioClient minioClient;
    private final MinioClient publicMinioClient;
    private final MinIOConfig minIOConfig;

    public FileServiceImpl(
            MinioClient minioClient,
            @Qualifier("publicMinioClient") MinioClient publicMinioClient,
            MinIOConfig minIOConfig) {
        this.minioClient = minioClient;
        this.publicMinioClient = publicMinioClient;
        this.minIOConfig = minIOConfig;
    }

    @Override
    public List<FileUploadResponse> upload(String accountId, FileFolder folder, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No files provided");
        }
        if (files.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At most " + MAX_FILES + " files per request");
        }
        files.forEach(this::validateFile);
        return files.stream().map(f -> uploadOne(accountId, folder, f)).toList();
    }

    @Override
    public void delete(String accountId, String url) {
        String objectName = toOwnedObjectName(accountId, null, url);
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(minIOConfig.getBucketName())
                    .object(objectName)
                    .build());
        } catch (Exception e) {
            log.error("Failed to delete {}", objectName, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete file");
        }
    }

    @Override
    public String presignedUrl(String accountId, String role, String url) {
        String objectName = toOwnedObjectName(accountId, role, url);
        if (FileFolder.fromPath(objectName.substring(0, objectName.indexOf('/')))
                .isPublicRead()) {
            return url;
        }
        try {
            return publicMinioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(minIOConfig.getBucketName())
                    .object(objectName)
                    .expiry(PRESIGNED_MINUTES, TimeUnit.MINUTES)
                    .build());
        } catch (Exception e) {
            log.error("Failed to sign {}", objectName, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create link");
        }
    }

    private FileUploadResponse uploadOne(String accountId, FileFolder folder, MultipartFile file) {
        String extension = extensionOf(file.getOriginalFilename());
        String contentType = ALLOWED_TYPES.get(extension);
        // <folder>/<uploader accountId>/<uuid>.<ext>: the accountId segment is what delete() checks ownership against
        String objectName = folder.getPath() + "/" + accountId + "/" + UUID.randomUUID() + extension;
        try (InputStream in = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder().bucket(minIOConfig.getBucketName()).object(objectName).stream(
                            in, file.getSize(), -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            log.error("Failed to upload {}", objectName, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload file");
        }
        return FileUploadResponse.builder()
                .url(publicBase() + objectName)
                .objectName(objectName)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .contentType(contentType)
                .build();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds maximum allowed size of 5MB");
        }
        if (!ALLOWED_TYPES.containsKey(extensionOf(file.getOriginalFilename()))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "File type not allowed. Allowed types: jpg, jpeg, png, webp, pdf");
        }
    }

    /**
     * Turns a URL returned by upload() into its object name; only the uploader (or an ADMIN, when role is given)
     * may use it.
     */
    private String toOwnedObjectName(String accountId, String role, String url) {
        String base = publicBase();
        if (url == null || !url.startsWith(base)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a file of this service");
        }
        String objectName = url.substring(base.length());
        // limit -1 keeps trailing empty parts, so "folder/user/" is rejected below
        String[] parts = objectName.split("/", -1);
        if (parts.length != OBJECT_NAME_PARTS
                || FileFolder.fromPath(parts[0]) == null
                || parts[2].isEmpty()
                || objectName.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a file of this service");
        }
        if (!parts[1].equals(accountId) && !"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this file");
        }
        return objectName;
    }

    private String publicBase() {
        String baseUrl = minIOConfig.getPublicUrl();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl + "/" + minIOConfig.getBucketName() + "/";
    }

    private static String extensionOf(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        return dot == -1 ? "" : filename.substring(dot).toLowerCase(Locale.ROOT);
    }
}
