package com.moonkage.vendor.deliveryarea;

import static org.junit.jupiter.api.Assertions.assertEquals;

import jakarta.persistence.EntityManager;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * DeliveryArea links to its vendor by id only; the foreign key to vendors stays in the database. The vendor row is
 * written with SQL because the Vendor entity belongs to another component.
 */
@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=validate")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class DeliveryAreaRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String VENDOR_ID = "vendor-1";

    private final EntityManager entityManager;
    private final JdbcTemplate jdbcTemplate;
    private final DeliveryAreaRepository deliveryAreaRepository;

    @Autowired
    DeliveryAreaRepositoryIntegrationTest(
            EntityManager entityManager, JdbcTemplate jdbcTemplate, DeliveryAreaRepository deliveryAreaRepository) {
        this.entityManager = entityManager;
        this.jdbcTemplate = jdbcTemplate;
        this.deliveryAreaRepository = deliveryAreaRepository;
    }

    @Test
    void deliveryAreasAreProvinceCodesOfAVendor() {
        jdbcTemplate.update("""
                INSERT INTO vendors (id, owner_account_id, business_name, entity_type, tax_code, address,
                                     province_code, supply_source, sells_shop, accepts_orders, status,
                                     created_at, updated_at)
                VALUES (?, 'owner-1', 'Tiệm bánh Trăng', 'HOUSEHOLD_BUSINESS', '0312345678', '12 Lê Lợi',
                        '79', 'SELF_PRODUCED', true, false, 'PENDING', now(), now())
                """, VENDOR_ID);
        DeliveryArea area = new DeliveryArea();
        area.setVendorId(VENDOR_ID);
        area.setProvinceCode("01");
        deliveryAreaRepository.saveAndFlush(area);
        entityManager.clear();

        List<String> codes = deliveryAreaRepository.findAll().stream()
                .map(DeliveryArea::getProvinceCode)
                .toList();

        assertEquals(List.of("01"), codes);
    }
}
