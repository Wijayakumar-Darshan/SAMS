package com.SAMS.demo.storage;



import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Service
public class PaymentSlipStorageService {

    private static final long MAX_FILE_SIZE =
            5L * 1024L * 1024L;

    private static final Map<String, String> EXTENSIONS =
            Map.of(
                    "image/jpeg", "jpg",
                    "image/png", "png",
                    "application/pdf", "pdf"
            );

    private final S3Client s3Client;
    private final S3Presigner presigner;
    private final String bucket;

    public PaymentSlipStorageService(
            S3Client s3Client,
            S3Presigner presigner,
            @Value("${app.storage.bucket}") String bucket
    ) {
        this.s3Client = s3Client;
        this.presigner = presigner;
        this.bucket = bucket;
    }

    public String upload(
            MultipartFile file,
            String userRole,
            Long userId
    ) {
        validate(file, userId);

        String contentType = file.getContentType()
                .toLowerCase(Locale.ROOT);

        String extension = EXTENSIONS.get(contentType);

        String safeRole = userRole == null
                ? "unknown"
                : userRole
                        .toLowerCase(Locale.ROOT)
                        .replaceAll("[^a-z0-9_-]", "");

        if (safeRole.isBlank()) {
            safeRole = "unknown";
        }

        String objectKey =
                "payments/"
                        + safeRole
                        + "/"
                        + userId
                        + "/"
                        + UUID.randomUUID()
                        + "."
                        + extension;

        PutObjectRequest request =
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(objectKey)
                        .contentType(contentType)
                        .contentLength(file.getSize())
                        .build();

        try (InputStream input = file.getInputStream()) {
            s3Client.putObject(
                    request,
                    RequestBody.fromInputStream(
                            input,
                            file.getSize()
                    )
            );

            return objectKey;
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Could not read the payment slip",
                    exception
            );
        } catch (RuntimeException exception) {
            throw new IllegalStateException(
                    "Could not upload the payment slip",
                    exception
            );
        }
    }

    public String createTemporaryViewUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            throw new IllegalArgumentException(
                    "Payment slip is unavailable"
            );
        }

        GetObjectRequest getRequest =
                GetObjectRequest.builder()
                        .bucket(bucket)
                        .key(objectKey)
                        .build();

        GetObjectPresignRequest presignRequest =
                GetObjectPresignRequest.builder()
                        .signatureDuration(
                                Duration.ofMinutes(5)
                        )
                        .getObjectRequest(getRequest)
                        .build();

        return presigner
                .presignGetObject(presignRequest)
                .url()
                .toString();
    }

    public void delete(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return;
        }

        s3Client.deleteObject(
                DeleteObjectRequest.builder()
                        .bucket(bucket)
                        .key(objectKey)
                        .build()
        );
    }

    private void validate(
            MultipartFile file,
            Long userId
    ) {
        if (userId == null) {
            throw new IllegalArgumentException(
                    "Authenticated user is required"
            );
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Please select a payment slip"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "Payment slip must not exceed 5 MB"
            );
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                !EXTENSIONS.containsKey(
                        contentType.toLowerCase(Locale.ROOT)
                )) {
            throw new IllegalArgumentException(
                    "Only JPG, PNG and PDF files are allowed"
            );
        }
    }
}