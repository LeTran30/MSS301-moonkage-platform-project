package com.moonkage.identity.address;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.moonkage.identity.account.AccountFixtures;
import jakarta.persistence.EntityManager;
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

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class AddressRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private final EntityManager entityManager;
    private final AddressRepository addressRepository;

    @Autowired
    AddressRepositoryIntegrationTest(EntityManager entityManager, AddressRepository addressRepository) {
        this.entityManager = entityManager;
        this.addressRepository = addressRepository;
    }

    @Test
    void addressesComeDefaultFirstThenNewest() throws InterruptedException {
        String owner = AccountFixtures.persistMember(entityManager, "lan@x.vn");
        addressRepository.saveAndFlush(address(owner, "old", false));
        Thread.sleep(5);
        addressRepository.saveAndFlush(address(owner, "default", true));
        Thread.sleep(5);
        addressRepository.saveAndFlush(address(owner, "newest", false));

        List<Address> addresses = addressRepository.findByAccountIdOrderByIsDefaultDescCreatedAtDesc(owner);

        assertEquals(
                List.of("default", "newest", "old"),
                addresses.stream().map(Address::getDetail).toList());
        assertNotNull(addresses.get(0).getCreatedAt());
    }

    private static Address address(String ownerId, String detail, boolean isDefault) {
        Address address = new Address();
        address.setAccountId(ownerId);
        address.setRecipientName("Nguyễn Lan");
        address.setRecipientPhone("0912345678");
        address.setProvinceCode("79");
        address.setProvinceName("Thành phố Hồ Chí Minh");
        address.setWardName("Phường Sài Gòn");
        address.setDetail(detail);
        address.setDefault(isDefault);
        return address;
    }
}
