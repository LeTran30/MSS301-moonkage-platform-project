package com.moonkage.vendor.repository;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.moonkage.vendor.entity.BankAccount;
import com.moonkage.vendor.entity.DeliveryArea;
import com.moonkage.vendor.entity.Vendor;
import com.moonkage.vendor.enums.SupplySource;
import com.moonkage.vendor.enums.VendorEntityType;
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

    private final EntityManager entityManager;
    private final VendorRepository vendorRepository;
    private final DeliveryAreaRepository deliveryAreaRepository;

    @Autowired
    VendorRepositoryIntegrationTest(
            EntityManager entityManager,
            VendorRepository vendorRepository,
            DeliveryAreaRepository deliveryAreaRepository) {
        this.entityManager = entityManager;
        this.vendorRepository = vendorRepository;
        this.deliveryAreaRepository = deliveryAreaRepository;
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

    @Test
    void deliveryAreasAreProvinceCodes() {
        Vendor vendor = vendorRepository.saveAndFlush(vendor("owner-2"));
        DeliveryArea area = new DeliveryArea();
        area.setVendor(vendor);
        area.setProvinceCode("01");
        deliveryAreaRepository.saveAndFlush(area);
        entityManager.clear();

        List<String> codes = deliveryAreaRepository.findAll().stream()
                .map(DeliveryArea::getProvinceCode)
                .toList();

        assertEquals(List.of("01"), codes);
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
