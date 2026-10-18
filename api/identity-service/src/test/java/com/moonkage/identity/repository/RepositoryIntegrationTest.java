package com.moonkage.identity.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.Address;
import com.moonkage.identity.entity.LegalProfile;
import com.moonkage.identity.entity.OutboxEvent;
import com.moonkage.identity.enums.Role;
import com.moonkage.identity.enums.Sex;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * What only the real database can show: unique keys, the custom queries and the row lock, on the same PostgreSQL
 * image as docker-compose. Skipped when Docker is not running.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class RepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private final AccountRepository accountRepository;
    private final LegalProfileRepository legalProfileRepository;
    private final AddressRepository addressRepository;
    private final OutboxEventRepository outboxEventRepository;

    @Autowired
    RepositoryIntegrationTest(
            AccountRepository accountRepository,
            LegalProfileRepository legalProfileRepository,
            AddressRepository addressRepository,
            OutboxEventRepository outboxEventRepository) {
        this.accountRepository = accountRepository;
        this.legalProfileRepository = legalProfileRepository;
        this.addressRepository = addressRepository;
        this.outboxEventRepository = outboxEventRepository;
    }

    @Test
    void uniquenessQueryReportsEmailBeforePhone() {
        accountRepository.saveAndFlush(account("lan@x.vn", "912345678"));

        assertEquals(
                AccountRepository.VALIDATION_EMAIL_EXISTS,
                accountRepository.validateAccountUniqueness("lan@x.vn", "912345678"));
        assertEquals(
                AccountRepository.VALIDATION_PHONE_EXISTS,
                accountRepository.validateAccountUniqueness("other@x.vn", "912345678"));
        assertEquals("VALID", accountRepository.validateAccountUniqueness("other@x.vn", null));
    }

    @Test
    void emailAndPhoneAreUniqueInTheDatabaseToo() {
        accountRepository.saveAndFlush(account("lan@x.vn", "912345678"));

        assertThrows(
                DataIntegrityViolationException.class, () -> accountRepository.saveAndFlush(account("lan@x.vn", null)));
    }

    @Test
    void phoneOfAnotherAccountIsRefused() {
        accountRepository.saveAndFlush(account("lan@x.vn", "912345678"));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> accountRepository.saveAndFlush(account("mai@x.vn", "912345678")));
    }

    @Test
    void oneIdCardCannotBeLinkedToTwoAccounts() {
        // BR-23: uk_legal_profiles_id_hash is the last guard when two accounts verify the same card at once
        Account first = accountRepository.saveAndFlush(account("lan@x.vn", null));
        Account second = accountRepository.saveAndFlush(account("mai@x.vn", null));
        legalProfileRepository.saveAndFlush(legalProfile(first, "same-hash"));
        assertTrue(legalProfileRepository.existsByIdNumberHashAndIdHashKeyVer("same-hash", 1));

        // last statement: after a failed statement PostgreSQL aborts the test transaction
        assertThrows(
                DataIntegrityViolationException.class,
                () -> legalProfileRepository.saveAndFlush(legalProfile(second, "same-hash")));
    }

    @Test
    void rowLockQueryRunsOnPostgres() {
        Account saved = accountRepository.saveAndFlush(account("lan@x.vn", null));

        // SELECT ... FOR UPDATE, used by addresses (FR-03) and the NFC attempt counter (FR-04)
        assertEquals(
                saved.getId(),
                accountRepository.findByIdForUpdate(saved.getId()).orElseThrow().getId());
    }

    @Test
    void addressesComeDefaultFirstThenNewest() throws InterruptedException {
        Account owner = accountRepository.saveAndFlush(account("lan@x.vn", null));
        addressRepository.saveAndFlush(address(owner, "old", false));
        Thread.sleep(5);
        addressRepository.saveAndFlush(address(owner, "default", true));
        Thread.sleep(5);
        addressRepository.saveAndFlush(address(owner, "newest", false));

        List<Address> addresses = addressRepository.findByAccountIdOrderByIsDefaultDescCreatedAtDesc(owner.getId());

        assertEquals(
                List.of("default", "newest", "old"),
                addresses.stream().map(Address::getDetail).toList());
        // Q-17: BaseEntity timestamps
        assertNotNull(addresses.get(0).getCreatedAt());
    }

    @Test
    void outboxReturnsOnlyUnsentEventsOldestFirst() throws InterruptedException {
        outboxEventRepository.saveAndFlush(outbox("e-1", null));
        Thread.sleep(5);
        outboxEventRepository.saveAndFlush(outbox("e-2", Instant.now()));
        Thread.sleep(5);
        outboxEventRepository.saveAndFlush(outbox("e-3", null));
        Thread.sleep(5);
        outboxEventRepository.saveAndFlush(outbox("e-4", null));

        List<OutboxEvent> batch =
                outboxEventRepository.findByPublishedAtIsNullOrderByCreatedAtAsc(PageRequest.of(0, 2));

        assertEquals(
                List.of("e-1", "e-3"), batch.stream().map(OutboxEvent::getId).toList());
    }

    private static Account account(String email, String phone) {
        return Account.builder()
                .email(email)
                .phoneNumber(phone)
                .passwordHash("hash")
                .accountVerified(true)
                .role(Role.MEMBER)
                .build();
    }

    private static LegalProfile legalProfile(Account account, String idHash) {
        return LegalProfile.builder()
                .account(account)
                .legalName("NGUYEN VAN A")
                .sex(Sex.MALE)
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

    private static Address address(Account owner, String detail, boolean isDefault) {
        Address address = new Address();
        address.setAccount(owner);
        address.setDetail(detail);
        address.setAreaCode("HCM");
        address.setDefault(isDefault);
        return address;
    }

    private static OutboxEvent outbox(String id, Instant publishedAt) {
        return OutboxEvent.builder()
                .id(id)
                .routingKey("account.nfc_verified")
                .payload("{}")
                .publishedAt(publishedAt)
                .build();
    }
}
