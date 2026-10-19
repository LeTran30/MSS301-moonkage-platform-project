package com.moonkage.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.minio.GetObjectResponse;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PostPolicy;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.credentials.Credentials;
import io.minio.errors.ErrorResponseException;
import io.minio.http.Method;
import io.minio.messages.ErrorResponse;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Map;
import java.util.Set;
import javax.imageio.ImageIO;
import okhttp3.Headers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.util.unit.DataSize;

class ObjectStorageTest {

    private static final Instant NOW = Instant.parse("2026-10-20T00:00:00Z");
    private static final String TEMP_KEY = "tmp/123e4567-e89b-12d3-a456-426614174000.png";
    private static final FileLimit IMAGES = new FileLimit(Set.of("image/png", "image/jpeg"), DataSize.ofMegabytes(5));

    private final StorageProperties properties = new StorageProperties(
            "http://minio:9000",
            "http://localhost:9000/",
            "key",
            "secret",
            "us-east-1",
            "pub",
            "priv",
            "tmp",
            Duration.ofMinutes(10),
            Duration.ofMinutes(5));

    private MinioClient internalClient;
    private MinioClient browserUrlSigner;
    private ObjectStorage storage;

    @BeforeEach
    void setUp() {
        internalClient = mock(MinioClient.class);
        browserUrlSigner = mock(MinioClient.class);
        storage = new ObjectStorage(properties, internalClient, browserUrlSigner, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void createPresignedUploadLinkSignsAPostPolicyBindingKeyTypeAndSize() throws Exception {
        when(browserUrlSigner.getPresignedPostFormData(any()))
                .thenReturn(Map.of("policy", "signed-policy", "x-amz-signature", "sig"));

        PresignedUploadLink uploadLink = storage.createPresignedUploadLink("image/jpeg", 1024, IMAGES);

        assertThat(uploadLink.tempKey()).startsWith("tmp/").endsWith(".jpg");
        assertThat(uploadLink.uploadUrl()).isEqualTo("http://localhost:9000/priv");
        assertThat(uploadLink.expiresAt()).isEqualTo(NOW.plus(Duration.ofMinutes(10)));
        assertThat(uploadLink.formFields())
                .containsEntry("key", uploadLink.tempKey())
                .containsEntry("Content-Type", "image/jpeg")
                .containsEntry("policy", "signed-policy")
                .containsEntry("x-amz-signature", "sig");

        ArgumentCaptor<PostPolicy> policy = ArgumentCaptor.forClass(PostPolicy.class);
        verify(browserUrlSigner).getPresignedPostFormData(policy.capture());
        assertThat(policy.getValue().bucket()).isEqualTo("priv");
        String conditions = decodePolicy(policy.getValue());
        assertThat(conditions)
                .contains("[\"eq\",\"$key\",\"" + uploadLink.tempKey() + "\"]")
                .contains("[\"eq\",\"$Content-Type\",\"image/jpeg\"]")
                .contains("[\"content-length-range\",1,1024]")
                .contains("2026-10-20T00:10:00");
    }

    @Test
    void createPresignedUploadLinkRejectsTypeOutsideLimitAndOversizedFile() {
        assertThatThrownBy(() -> storage.createPresignedUploadLink("application/pdf", 10, IMAGES))
                .isInstanceOf(InvalidFileException.class);
        assertThatThrownBy(() -> storage.createPresignedUploadLink(
                        "image/png", DataSize.ofMegabytes(6).toBytes(), IMAGES))
                .isInstanceOf(InvalidFileException.class);
        assertThatThrownBy(() -> storage.createPresignedUploadLink("image/png", 0, IMAGES))
                .isInstanceOf(InvalidFileException.class);
    }

    @Test
    void moveUploadedFileWritesTheCleanedFileToTheTargetAndRemovesTemp() throws Exception {
        byte[] png = png();
        uploaded("image/png", png);

        String key = storage.moveUploadedFile(TEMP_KEY, IMAGES, BucketAccess.PUBLIC, "products");

        assertThat(key).isEqualTo("products/123e4567-e89b-12d3-a456-426614174000.png");
        ArgumentCaptor<PutObjectArgs> put = ArgumentCaptor.forClass(PutObjectArgs.class);
        verify(internalClient).putObject(put.capture());
        assertThat(put.getValue().bucket()).isEqualTo("pub");
        assertThat(put.getValue().object()).isEqualTo(key);
        assertThat(put.getValue().contentType()).isEqualTo("image/png");
        assertThat(put.getValue().stream().readAllBytes()).isEqualTo(png);
        verifyRemoved(TEMP_KEY);
    }

    @Test
    void moveUploadedFileDeletesAFileWhoseBytesAreNotTheDeclaredType() throws Exception {
        uploaded("image/png", "<html><script>alert(1)</script></html>".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> storage.moveUploadedFile(TEMP_KEY, IMAGES, BucketAccess.PUBLIC, "products"))
                .isInstanceOf(InvalidFileException.class)
                .extracting("errorCode")
                .isEqualTo(StorageErrorCode.CONTENT_MISMATCH);
        verify(internalClient, never()).putObject(any());
        verifyRemoved(TEMP_KEY);
    }

    @Test
    void moveUploadedFileDeletesFileWhoseRealTypeDiffersFromItsKey() throws Exception {
        stat("text/html", 100);

        assertThatThrownBy(() -> storage.moveUploadedFile(TEMP_KEY, IMAGES, BucketAccess.PUBLIC, "products"))
                .isInstanceOf(InvalidFileException.class);
        verify(internalClient, never()).putObject(any());
        verifyRemoved(TEMP_KEY);
    }

    @Test
    void moveUploadedFileDeletesOversizedFile() throws Exception {
        stat("image/png", DataSize.ofMegabytes(6).toBytes());

        assertThatThrownBy(() -> storage.moveUploadedFile(TEMP_KEY, IMAGES, BucketAccess.PUBLIC, "products"))
                .isInstanceOf(InvalidFileException.class);
        verify(internalClient, never()).putObject(any());
        verifyRemoved(TEMP_KEY);
    }

    @Test
    void verifyPrivateBucketAccessPassesWhenTheProbeKeyIsSimplyMissing() throws Exception {
        ErrorResponseException notFound = s3Error("NoSuchKey");
        when(internalClient.statObject(any())).thenThrow(notFound);

        storage.verifyPrivateBucketAccess();

        ArgumentCaptor<StatObjectArgs> stat = ArgumentCaptor.forClass(StatObjectArgs.class);
        verify(internalClient).statObject(stat.capture());
        assertThat(stat.getValue().bucket()).isEqualTo("priv");
        assertThat(stat.getValue().object()).startsWith("tmp/");
    }

    @Test
    void verifyPrivateBucketAccessFailsWithAHintWhenTheUserIsDenied() throws Exception {
        ErrorResponseException denied = s3Error("AccessDenied");
        when(internalClient.statObject(any())).thenThrow(denied);

        assertThatThrownBy(() -> storage.verifyPrivateBucketAccess())
                .isInstanceOf(StorageUnavailableException.class)
                .hasMessageContaining("key")
                .hasMessageContaining("priv/tmp/")
                .hasMessageContaining("minio-init");
    }

    @Test
    void verifyPrivateBucketAccessFailsWhenTheBucketIsMissing() throws Exception {
        ErrorResponseException noBucket = s3Error("NoSuchBucket");
        when(internalClient.statObject(any())).thenThrow(noBucket);

        assertThatThrownBy(() -> storage.verifyPrivateBucketAccess()).isInstanceOf(StorageUnavailableException.class);
    }

    @Test
    void moveUploadedFileRejectsMissingUpload() throws Exception {
        ErrorResponseException notFound = s3Error("NoSuchKey");
        when(internalClient.statObject(any())).thenThrow(notFound);

        assertThatThrownBy(() -> storage.moveUploadedFile(TEMP_KEY, IMAGES, BucketAccess.PUBLIC, "products"))
                .isInstanceOf(InvalidFileException.class)
                .extracting("errorCode")
                .isEqualTo(StorageErrorCode.NOT_UPLOADED);
    }

    @Test
    void moveUploadedFileRejectsKeysOutsideTempOrNotUuidNamed() throws Exception {
        for (String key : new String[] {
            "products/123e4567-e89b-12d3-a456-426614174000.png",
            "tmp/../products/x.png",
            "tmp/abc.png",
            "tmp/123e4567-e89b-12d3-a456-426614174000.png/x",
            null
        }) {
            assertThatThrownBy(() -> storage.moveUploadedFile(key, IMAGES, BucketAccess.PUBLIC, "products"))
                    .isInstanceOf(InvalidFileException.class);
        }
        verify(internalClient, never()).statObject(any());
    }

    @Test
    void toPublicUrlJoinsHostBucketAndKeyWithoutDoubleSlash() {
        assertThat(storage.toPublicUrl("products/a.png")).isEqualTo("http://localhost:9000/pub/products/a.png");
    }

    @Test
    void createPresignedDownloadUrlSignsGetOnPrivateBucket() throws Exception {
        when(browserUrlSigner.getPresignedObjectUrl(any())).thenReturn("signed-get");

        assertThat(storage.createPresignedDownloadUrl("mockups/a.pdf")).isEqualTo("signed-get");

        ArgumentCaptor<GetPresignedObjectUrlArgs> args = ArgumentCaptor.forClass(GetPresignedObjectUrlArgs.class);
        verify(browserUrlSigner).getPresignedObjectUrl(args.capture());
        assertThat(args.getValue().method()).isEqualTo(Method.GET);
        assertThat(args.getValue().bucket()).isEqualTo("priv");
        assertThat(args.getValue().expiry())
                .isEqualTo((int) Duration.ofMinutes(5).toSeconds());
    }

    private static ErrorResponseException s3Error(String code) {
        ErrorResponseException error = mock(ErrorResponseException.class);
        ErrorResponse body = mock(ErrorResponse.class);
        when(body.code()).thenReturn(code);
        when(error.errorResponse()).thenReturn(body);
        return error;
    }

    private static String decodePolicy(PostPolicy policy) throws Exception {
        Map<String, String> form = policy.formData(new Credentials("key", "secret", null, null), "us-east-1");
        return new String(Base64.getDecoder().decode(form.get("policy")), StandardCharsets.UTF_8);
    }

    private static byte[] png() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", out);
        return out.toByteArray();
    }

    /** The temp object exists with this type and content. */
    private void uploaded(String contentType, byte[] content) throws Exception {
        stat(contentType, content.length);
        when(internalClient.getObject(any()))
                .thenReturn(
                        new GetObjectResponse(Headers.of(), "priv", "", TEMP_KEY, new ByteArrayInputStream(content)));
    }

    private void stat(String contentType, long size) throws Exception {
        StatObjectResponse response = mock(StatObjectResponse.class);
        when(response.contentType()).thenReturn(contentType);
        when(response.size()).thenReturn(size);
        when(internalClient.statObject(any(StatObjectArgs.class))).thenReturn(response);
    }

    private void verifyRemoved(String key) throws Exception {
        ArgumentCaptor<RemoveObjectArgs> remove = ArgumentCaptor.forClass(RemoveObjectArgs.class);
        verify(internalClient).removeObject(remove.capture());
        assertThat(remove.getValue().bucket()).isEqualTo("priv");
        assertThat(remove.getValue().object()).isEqualTo(key);
    }
}
