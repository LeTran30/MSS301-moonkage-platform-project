package com.moonkage.identity.profile.infrastructure.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.account.AccountFixtures;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.profile.application.port.IdNumberTakenMeanwhile;
import com.moonkage.identity.profile.domain.LegalIdentity;
import com.moonkage.identity.profile.domain.Profile;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.LegalName;
import com.moonkage.identity.shared.MaskedIdNumber;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** The profiles table as the migrations build it: value objects round-trip, BR-23 and the KYC CHECK hold. */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
@Import(JpaProfileRepository.class)
class JpaProfileRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final IdNumberHash HASH = new IdNumberHash("a".repeat(IdNumberHash.LENGTH));

    private final EntityManager entityManager;
    private final JpaProfileRepository profiles;

    @Autowired
    JpaProfileRepositoryIntegrationTest(EntityManager entityManager, JpaProfileRepository profiles) {
        this.entityManager = entityManager;
        this.profiles = profiles;
    }

    @Test
    void legalIdentityIsWrittenOnceAndReadBack() {
        AccountId id = newProfile("lan@x.vn");
        assertEquals(Optional.empty(), profiles.find(id).orElseThrow().legalIdentity());

        profiles.findForUpdate(id).orElseThrow().completeKyc(identity());
        profiles.flush();
        entityManager.clear();

        Profile read = profiles.find(id).orElseThrow();
        assertEquals(new FullName("Nguyen Lan"), read.fullName());
        assertEquals(Optional.of(identity()), read.legalIdentity());
        assertTrue(profiles.isIdNumberTaken(HASH));
        assertFalse(profiles.isIdNumberTaken(new IdNumberHash("b".repeat(IdNumberHash.LENGTH))));
    }

    @Test
    void oneIdCardCannotBeLinkedToTwoAccounts() {
        // BR-23: the unique key is the last guard when two accounts check the same card at once
        AccountId first = newProfile("lan@x.vn");
        AccountId second = newProfile("mai@x.vn");
        profiles.findForUpdate(first).orElseThrow().completeKyc(identity());
        profiles.flush();

        profiles.findForUpdate(second).orElseThrow().completeKyc(identity());
        // last statement: after a failed statement PostgreSQL aborts the test transaction
        assertThrows(IdNumberTakenMeanwhile.class, profiles::flush);
    }

    @Test
    void halfWrittenLegalIdentityIsRefusedByTheDatabase() {
        AccountId id = newProfile("lan@x.vn");

        // ck_profiles_kyc_complete: SQL written by hand cannot mark a profile verified without its card data
        assertThrows(
                PersistenceException.class,
                () -> entityManager
                        .createNativeQuery("UPDATE profiles SET kyc_verified = true WHERE account_id = ?1")
                        .setParameter(1, id.toString())
                        .executeUpdate());
    }

    private AccountId newProfile(String email) {
        AccountId id = AccountId.fromStored(AccountFixtures.persistMember(entityManager, email));
        profiles.add(Profile.create(id, new FullName("Nguyen Lan")));
        profiles.flush();
        return id;
    }

    private static LegalIdentity identity() {
        return new LegalIdentity(new LegalName("NGUYEN VAN A"), HASH, 1, new MaskedIdNumber("********6789"));
    }
}
