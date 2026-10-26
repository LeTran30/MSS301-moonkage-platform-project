package com.moonkage.vendor.vendor;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import jakarta.persistence.EntityManager;
import java.time.Instant;
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

    private final EntityManager entityManager;
    private final VendorRepository vendorRepository;

    @Autowired
    VendorRepositoryIntegrationTest(EntityManager entityManager, VendorRepository vendorRepository) {
        this.entityManager = entityManager;
        this.vendorRepository = vendorRepository;
    }

    @Test
    void vendorWithEveryVerifiedFieldRoundTrips() {
        Vendor vendor = vendor("owner-1");
        BankAccount bank = new BankAccount();
        bank.setBankName("Vietcombank");
        bank.setEncryptedNumber(new byte[] {1, 2, 3});
        bank.setMaskedNumber("******6789");
        bank.setKeyVersion(1);
        bank.setHolder("NGUYEN VAN A");
        vendor.setBankAccount(bank);
        vendor.setRepresentativeName("Nguyễn Văn A");
        vendor.setRepresentativeIdHash("a".repeat(64));
        vendor.setRepresentativeIdKeyVer(1);
        vendor.setRepresentativeIdMasked("********1234");
        vendor.setLocalDeliveryFee(30_000L);
        vendor.setRegistrationFeeAmount(200_000L);
        vendor.setRegistrationFeePaidAt(Instant.parse("2026-10-26T03:00:00Z"));
        String id = vendorRepository.saveAndFlush(vendor).getId();
        entityManager.clear();

        Vendor saved = vendorRepository.findById(id).orElseThrow();

        assertEquals("Tiệm bánh Trăng", saved.getBusinessName());
        assertEquals("79", saved.getProvinceCode());
        assertEquals(VendorEntityType.SOLE_PROPRIETORSHIP, saved.getEntityType());
        assertArrayEquals(new byte[] {1, 2, 3}, saved.getBankAccount().getEncryptedNumber());
        assertEquals("******6789", saved.getBankAccount().getMaskedNumber());
        assertEquals("********1234", saved.getRepresentativeIdMasked());
        assertEquals(Instant.parse("2026-10-26T03:00:00Z"), saved.getRegistrationFeePaidAt());
        assertNotNull(saved.getCreatedAt());
    }

    private static Vendor vendor(String ownerAccountId) {
        Vendor vendor = new Vendor();
        vendor.setOwnerAccountId(ownerAccountId);
        vendor.setBusinessName("Tiệm bánh Trăng");
        vendor.setEntityType(VendorEntityType.SOLE_PROPRIETORSHIP);
        vendor.setTaxCode("0312345678");
        vendor.setAddress("12 Lê Lợi, Bến Thành");
        vendor.setProvinceCode("79");
        vendor.setSupplySource(SupplySource.SELF_PRODUCED);
        vendor.setSellsShop(true);
        return vendor;
    }
}
