package com.moonkage.vendor.vendor;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.moonkage.vendor.common.vo.ProvinceCode;
import com.moonkage.vendor.vendor.vo.RepresentativeName;
import com.moonkage.vendor.vendor.vo.TaxCode;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Runs the Flyway migrations on a real PostgreSQL and lets Hibernate validate every entity against them
 * ({@code ddl-auto: validate}): an entity that drifts from the schema fails here instead of at container start.
 */
@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=validate")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class VendorRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final Instant NFC_VERIFIED_AT = Instant.parse("2026-10-20T03:00:00Z");

    private final EntityManager entityManager;
    private final VendorRepository vendorRepository;
    private final VendorDocumentRepository documentRepository;
    private final VendorOwnerCheckRepository ownerCheckRepository;
    private final VendorReviewRepository reviewRepository;

    @Autowired
    VendorRepositoryIntegrationTest(
            EntityManager entityManager,
            VendorRepository vendorRepository,
            VendorDocumentRepository documentRepository,
            VendorOwnerCheckRepository ownerCheckRepository,
            VendorReviewRepository reviewRepository) {
        this.entityManager = entityManager;
        this.vendorRepository = vendorRepository;
        this.documentRepository = documentRepository;
        this.ownerCheckRepository = ownerCheckRepository;
        this.reviewRepository = reviewRepository;
    }

    @Test
    void aRegisteredVendorRoundTripsWithItsValueObjects() {
        String id = vendorRepository
                .saveAndFlush(Vendor.register("owner-1", profile()))
                .getId();
        entityManager.clear();

        Vendor saved = vendorRepository.findById(id).orElseThrow();

        assertEquals(VendorStatus.PENDING, saved.getStatus());
        assertEquals("Tiệm bánh Trăng", saved.getBusinessName());
        assertEquals(TaxCode.of("0312345678"), saved.getTaxCode());
        assertEquals(ProvinceCode.of("79"), saved.getProvinceCode());
        assertEquals(RepresentativeName.of("NGUYEN VAN A"), saved.getRepresentativeName());
        assertEquals(VendorEntityType.SOLE_PROPRIETORSHIP, saved.getEntityType());
        assertArrayEquals(new byte[] {1, 2, 3}, saved.getBankAccount().getEncryptedNumber());
        assertEquals("******6789", saved.getBankAccount().getMaskedNumber());
        assertEquals("********1234", saved.getRepresentativeIdMasked());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    void documentsOwnerChecksAndReviewsAreKeptPerVendorInOrder() {
        String vendorId = vendorRepository
                .saveAndFlush(Vendor.register("owner-2", profile()))
                .getId();
        documentRepository.saveAndFlush(VendorDocument.of(vendorId, DocumentKind.BUSINESS_LICENSE, "vendor/a/1.pdf"));
        documentRepository.saveAndFlush(VendorDocument.of(vendorId, DocumentKind.BUSINESS_LICENSE, "vendor/a/2.pdf"));
        OwnerCard card = new OwnerCard(
                "NGUYỄN VĂN A",
                "********1234",
                NFC_VERIFIED_AT,
                true,
                new HashedIdNumber("a".repeat(64), 1, "********1234"));
        ownerCheckRepository.saveAndFlush(VendorOwnerCheck.of(vendorId, 1, card, NameMatch.MATCH));
        ownerCheckRepository.saveAndFlush(VendorOwnerCheck.of(vendorId, 2, card, NameMatch.MISMATCH));
        reviewRepository.saveAndFlush(
                VendorReview.of(vendorId, "admin-1", ReviewDecision.NEEDS_INFO, "Ảnh mờ", false, false));
        entityManager.clear();

        List<VendorDocument> documents = documentRepository.findByVendorIdOrderByUploadedAtAsc(vendorId);
        VendorOwnerCheck latest = ownerCheckRepository
                .findFirstByVendorIdOrderBySubmissionNoDesc(vendorId)
                .orElseThrow();

        assertEquals("vendor/a/2.pdf", documents.getLast().getObjectKey());
        assertEquals(2, latest.getSubmissionNo());
        assertEquals(NameMatch.MISMATCH, latest.getNameMatch());
        assertEquals(NFC_VERIFIED_AT, latest.getNfcVerifiedAt());
        assertEquals(
                "Ảnh mờ",
                reviewRepository
                        .findByVendorIdOrderByDecidedAtAsc(vendorId)
                        .getFirst()
                        .getReason());
    }

    private static VendorProfile profile() {
        return new VendorProfile(
                "Tiệm bánh Trăng",
                VendorEntityType.SOLE_PROPRIETORSHIP,
                TaxCode.of("0312345678"),
                "12 Lê Lợi, Bến Thành",
                ProvinceCode.of("79"),
                RepresentativeName.of("NGUYEN VAN A"),
                new HashedIdNumber("a".repeat(64), 1, "********1234"),
                SupplySource.SELF_PRODUCED,
                true,
                false,
                BankAccount.of(
                        "Vietcombank",
                        "NGUYEN VAN A",
                        new EncryptedBankAccountNumber(new byte[] {1, 2, 3}, 1, "******6789")));
    }
}
