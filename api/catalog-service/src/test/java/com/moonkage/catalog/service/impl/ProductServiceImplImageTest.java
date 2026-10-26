package com.moonkage.catalog.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.catalog.client.VendorClient;
import com.moonkage.catalog.common.exception.CustomException;
import com.moonkage.catalog.config.ProductImageProperties;
import com.moonkage.catalog.dto.client.VendorInfo;
import com.moonkage.catalog.dto.request.CreateProductRequest;
import com.moonkage.catalog.dto.request.ImageUploadRequest;
import com.moonkage.catalog.dto.request.UpdateProductRequest;
import com.moonkage.catalog.dto.response.PresignedUploadLinkResponse;
import com.moonkage.catalog.dto.response.ProductResponse;
import com.moonkage.catalog.entity.Product;
import com.moonkage.catalog.enums.DeliveryLabel;
import com.moonkage.catalog.enums.ProductStatus;
import com.moonkage.catalog.repository.ProductRepository;
import com.moonkage.storage.BucketAccess;
import com.moonkage.storage.FileLimit;
import com.moonkage.storage.InvalidFileException;
import com.moonkage.storage.ObjectStorage;
import com.moonkage.storage.PresignedUploadLink;
import com.moonkage.storage.StorageErrorCode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.unit.DataSize;

/** Image handling of ProductServiceImpl: moving uploads, order, rejection and keeping MinIO in line with the DB. */
class ProductServiceImplImageTest {

    private static final String ACCOUNT_ID = "account-1";
    private static final String PRODUCT_ID = "product-1";
    private static final VendorInfo SHOP =
            new VendorInfo("vendor-1", ACCOUNT_ID, "Shop", "APPROVED", "OWN", true, false, true);
    private static final String TEMP_A = "tmp/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
    private static final String TEMP_B = "tmp/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png";
    private static final String FINAL_A = "products/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
    private static final String FINAL_B = "products/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png";
    private static final String KEPT = "products/kept.png";
    private static final String DROPPED = "products/dropped.png";

    private final ProductImageProperties productImageProperties =
            new ProductImageProperties(Set.of("image/png"), DataSize.ofMegabytes(5));

    private ProductRepository productRepository;
    private VendorClient vendorClient;
    private ObjectStorage objectStorage;
    private ProductServiceImpl productService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        vendorClient = mock(VendorClient.class);
        objectStorage = mock(ObjectStorage.class);
        productService = new ProductServiceImpl(
                productRepository,
                mock(ApplicationEventPublisher.class),
                vendorClient,
                objectStorage,
                productImageProperties);

        when(vendorClient.getVendorByOwnerAccountId(ACCOUNT_ID)).thenReturn(SHOP);
        when(productRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(productRepository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(objectStorage.isTempKey(anyString()))
                .thenAnswer(
                        invocation -> invocation.getArgument(0, String.class).startsWith("tmp/"));
        when(objectStorage.toPublicUrl(anyString()))
                .thenAnswer(invocation -> "http://files/" + invocation.getArgument(0));
        when(objectStorage.moveUploadedFile(eq(TEMP_A), any(), eq(BucketAccess.PUBLIC), eq("products")))
                .thenReturn(FINAL_A);
        when(objectStorage.moveUploadedFile(eq(TEMP_B), any(), eq(BucketAccess.PUBLIC), eq("products")))
                .thenReturn(FINAL_B);

        // the service registers its MinIO clean-up with the transaction; tests end it by hand
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach
    void tearDown() {
        TransactionSynchronizationManager.clearSynchronization();
    }

    @Test
    void createImageUploadLinkPassesTheProductImageLimitAndReturnsTheTempKey() {
        Instant expiresAt = Instant.parse("2026-10-20T00:10:00Z");
        when(objectStorage.createPresignedUploadLink(eq("image/png"), eq(1024L), any()))
                .thenReturn(new PresignedUploadLink(
                        TEMP_A, "http://minio/priv", Map.of("key", TEMP_A, "policy", "signed"), expiresAt));

        PresignedUploadLinkResponse response =
                productService.createImageUploadLink(ACCOUNT_ID, new ImageUploadRequest("image/png", 1024L));

        assertThat(response.tempKey()).isEqualTo(TEMP_A);
        assertThat(response.uploadUrl()).isEqualTo("http://minio/priv");
        assertThat(response.formFields()).containsEntry("key", TEMP_A).containsEntry("policy", "signed");
        assertThat(response.expiresAt()).isEqualTo(expiresAt);
        verify(objectStorage)
                .createPresignedUploadLink(
                        "image/png", 1024L, new FileLimit(Set.of("image/png"), DataSize.ofMegabytes(5)));
    }

    @Test
    void createImageUploadLinkRefusesAccountWithoutApprovedShop() {
        when(vendorClient.getVendorByOwnerAccountId(ACCOUNT_ID))
                .thenReturn(new VendorInfo("vendor-1", ACCOUNT_ID, "Shop", "PENDING", "OWN", true, false, false));

        assertThatThrownBy(
                        () -> productService.createImageUploadLink(ACCOUNT_ID, new ImageUploadRequest("image/png", 1L)))
                .isInstanceOf(CustomException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.FORBIDDEN);
        verify(objectStorage, never()).createPresignedUploadLink(anyString(), any(Long.class), any());
    }

    @Test
    void createProductMovesEveryUploadAndKeepsTheirOrder() {
        ProductResponse response = productService.createProduct(ACCOUNT_ID, createRequest(List.of(TEMP_B, TEMP_A)));

        assertThat(response.getImageKeys()).containsExactly(FINAL_B, FINAL_A);
        assertThat(response.getImageUrls()).containsExactly("http://files/" + FINAL_B, "http://files/" + FINAL_A);
        endTransaction(TransactionSynchronization.STATUS_COMMITTED);
        verify(objectStorage, never()).deleteQuietly(any(), anyString());
    }

    @Test
    void createProductRefusesAKeyThatIsNotAnUpload() {
        assertThatThrownBy(() -> productService.createProduct(ACCOUNT_ID, createRequest(List.of(TEMP_A, KEPT))))
                .isInstanceOf(CustomException.class);

        verify(objectStorage, never()).moveUploadedFile(anyString(), any(), any(), anyString());
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProductRefusesDuplicateKeys() {
        assertThatThrownBy(() -> productService.createProduct(ACCOUNT_ID, createRequest(List.of(TEMP_A, TEMP_A))))
                .isInstanceOf(CustomException.class);

        verify(objectStorage, never()).moveUploadedFile(anyString(), any(), any(), anyString());
    }

    @Test
    void createProductDeletesAlreadyMovedImagesWhenALaterUploadIsRejected() {
        when(objectStorage.moveUploadedFile(eq(TEMP_B), any(), any(), anyString()))
                .thenThrow(new InvalidFileException(StorageErrorCode.FILE_TOO_LARGE, 5L));

        assertThatThrownBy(() -> productService.createProduct(ACCOUNT_ID, createRequest(List.of(TEMP_A, TEMP_B))))
                .isInstanceOf(InvalidFileException.class);

        verify(objectStorage).deleteQuietly(BucketAccess.PUBLIC, FINAL_A);
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProductDeletesMovedImagesWhenTheTransactionRollsBack() {
        productService.createProduct(ACCOUNT_ID, createRequest(List.of(TEMP_A)));

        endTransaction(TransactionSynchronization.STATUS_ROLLED_BACK);

        verify(objectStorage).deleteQuietly(BucketAccess.PUBLIC, FINAL_A);
    }

    @Test
    void updateProductKeepsExistingAddsNewAndDeletesDroppedAfterCommit() {
        stubExistingProduct(KEPT, DROPPED);

        ProductResponse response =
                productService.updateProduct(ACCOUNT_ID, PRODUCT_ID, updateRequest(List.of(TEMP_A, KEPT)));

        assertThat(response.getImageKeys()).containsExactly(FINAL_A, KEPT);
        verify(objectStorage, never()).moveUploadedFile(eq(KEPT), any(), any(), anyString());
        verify(objectStorage, never()).deleteQuietly(any(), anyString());

        endTransaction(TransactionSynchronization.STATUS_COMMITTED);

        verify(objectStorage).deleteQuietly(BucketAccess.PUBLIC, DROPPED);
        verify(objectStorage, never()).deleteQuietly(BucketAccess.PUBLIC, FINAL_A);
        verify(objectStorage, never()).deleteQuietly(BucketAccess.PUBLIC, KEPT);
    }

    @Test
    void updateProductRollbackDeletesOnlyTheNewImages() {
        stubExistingProduct(KEPT, DROPPED);

        productService.updateProduct(ACCOUNT_ID, PRODUCT_ID, updateRequest(List.of(TEMP_A, KEPT)));
        endTransaction(TransactionSynchronization.STATUS_ROLLED_BACK);

        verify(objectStorage).deleteQuietly(BucketAccess.PUBLIC, FINAL_A);
        verify(objectStorage, never()).deleteQuietly(BucketAccess.PUBLIC, DROPPED);
        verify(objectStorage, never()).deleteQuietly(BucketAccess.PUBLIC, KEPT);
    }

    @Test
    void updateProductWithoutImageKeysLeavesImagesAlone() {
        stubExistingProduct(KEPT);

        ProductResponse response = productService.updateProduct(ACCOUNT_ID, PRODUCT_ID, updateRequest(List.of()));

        assertThat(response.getImageKeys()).containsExactly(KEPT);
        assertThat(TransactionSynchronizationManager.getSynchronizations()).isEmpty();
    }

    @Test
    void updateProductRefusesAnImageOfAnotherProduct() {
        stubExistingProduct(KEPT);

        assertThatThrownBy(() -> productService.updateProduct(
                        ACCOUNT_ID, PRODUCT_ID, updateRequest(List.of("products/someone-else.png"))))
                .isInstanceOf(CustomException.class);
        verify(objectStorage, never()).moveUploadedFile(anyString(), any(), any(), anyString());
    }

    private static CreateProductRequest createRequest(List<String> imageKeys) {
        CreateProductRequest request = new CreateProductRequest();
        request.setName("Bánh nướng");
        request.setDescription("Hộp 4 bánh");
        request.setImageKeys(imageKeys);
        request.setListPrice(450_000L);
        request.setStock(10);
        request.setExpiryDate(LocalDate.of(2026, 12, 31));
        request.setDeliveryLabel(DeliveryLabel.LOCAL);
        return request;
    }

    private static UpdateProductRequest updateRequest(List<String> imageKeys) {
        UpdateProductRequest request = new UpdateProductRequest();
        request.setImageKeys(imageKeys);
        return request;
    }

    private void stubExistingProduct(String... imageKeys) {
        Product product = new Product();
        product.setId(PRODUCT_ID);
        product.setVendorId(SHOP.id());
        product.setStatus(ProductStatus.ON_SALE);
        product.setListPrice(450_000L);
        product.setStock(10);
        product.setImageKeys(new ArrayList<>(List.of(imageKeys)));
        when(productRepository.findByIdAndDeletedFalse(PRODUCT_ID)).thenReturn(Optional.of(product));
    }

    private static void endTransaction(int status) {
        TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCompletion(status));
    }
}
