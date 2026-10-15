package com.bake2b.file.config;

import com.bake2b.file.enums.FileFolder;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import java.util.Arrays;
import java.util.stream.Collectors;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Slf4j
@Configuration
@Getter
public class MinIOConfig {

    @Value("${minio.url}")
    private String url;

    @Value("${minio.public-url}")
    private String publicUrl;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Bean
    @Primary
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey)
                .build();
    }

    /**
     * Signs presigned links with the browser-facing host (the signature covers the host).
     * Region is fixed so signing never calls MinIO through an address this container cannot reach.
     */
    @Bean
    public MinioClient publicMinioClient() {
        return MinioClient.builder()
                .endpoint(publicUrl)
                .region("us-east-1")
                .credentials(accessKey, secretKey)
                .build();
    }

    /**
     * Creates the bucket on first start and makes only the public folders (product images) anonymously readable.
     * An existing bucket keeps its policy, so pointing at a MinIO shared with another project never changes it.
     */
    @Bean
    public ApplicationRunner initBucket(MinioClient minioClient) {
        return args -> {
            if (minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucketName).build())) {
                return;
            }
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            log.info("Created MinIO bucket {}", bucketName);
            String resources = Arrays.stream(FileFolder.values())
                    .filter(FileFolder::isPublicRead)
                    .map(f -> "\"arn:aws:s3:::" + bucketName + "/" + f.getPath() + "/*\"")
                    .collect(Collectors.joining(","));
            String policy = """
                    {"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},\
                    "Action":["s3:GetObject"],"Resource":[%s]}]}""".formatted(resources);
            minioClient.setBucketPolicy(SetBucketPolicyArgs.builder()
                    .bucket(bucketName)
                    .config(policy)
                    .build());
        };
    }
}
