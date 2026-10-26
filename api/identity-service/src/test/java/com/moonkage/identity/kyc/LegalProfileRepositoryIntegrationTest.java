package com.moonkage.identity.kyc;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.AccountFixtures;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Integration tests for package-private LegalProfileRepository.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class LegalProfileRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private final EntityManager entityManager;
    private final LegalProfileRepository legalProfileRepository;

    @Autowired
    LegalProfileRepositoryIntegrationTest(EntityManager entityManager, LegalProfileRepository legalProfileRepository) {
        this.entityManager = entityManager;
        this.legalProfileRepository = legalProfileRepository;
    }

    @Test
    void oneIdCardCannotBeLinkedToTwoAccounts() {
        // BR-23: uk_legal_profiles_id_hash is the last guard when two accounts verify the same card at once
        String first = AccountFixtures.persistMember(entityManager, "lan@x.vn");
        String second = AccountFixtures.persistMember(entityManager, "mai@x.vn");
        legalProfileRepository.saveAndFlush(legalProfile(first, "same-hash"));
        assertTrue(legalProfileRepository.existsByIdNumberHashAndIdHashKeyVer("same-hash", 1));

        // last statement: after a failed statement PostgreSQL aborts the test transaction
        assertThrows(
                DataIntegrityViolationException.class,
                () -> legalProfileRepository.saveAndFlush(legalProfile(second, "same-hash")));
    }

    private static LegalProfile legalProfile(String accountId, String idHash) {
        return LegalProfile.builder()
                .accountId(accountId)
                .legalName("NGUYEN VAN A")
                .gender(Gender.MALE)
                .nationality("VIET NAM")
                .idNumberHash(idHash)
                .idHashKeyVer(1)
                .idNumberMasked("********6789")
                .idNumberEnc(new byte[] {1})
                .dateOfBirthEnc(new byte[] {2})
                .piiKeyVer(1)
                .nfcVerifiedAt(Instant.now())
                .build();
    }
}
