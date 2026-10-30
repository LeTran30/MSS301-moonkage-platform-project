package com.moonkage.identity.address.infrastructure.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.moonkage.identity.account.AccountFixtures;
import com.moonkage.identity.address.domain.AddressBook;
import com.moonkage.identity.address.domain.AddressEntry;
import com.moonkage.identity.address.domain.AddressFixtures;
import com.moonkage.identity.address.domain.AddressId;
import com.moonkage.identity.address.domain.AddressLabel;
import com.moonkage.identity.shared.AccountId;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.UUID;
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

/**
 * The addresses table as the migrations build it: value objects round-trip, the advisory lock runs, and moving the
 * default never trips ux_addresses_one_default_per_account (B-1).
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
@Import(JpaAddressBookRepository.class)
class JpaAddressBookRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private final EntityManager entityManager;
    private final JpaAddressBookRepository addressBooks;

    @Autowired
    JpaAddressBookRepositoryIntegrationTest(EntityManager entityManager, JpaAddressBookRepository addressBooks) {
        this.entityManager = entityManager;
        this.addressBooks = addressBooks;
    }

    @Test
    void addressComesBackAsSaved() {
        AccountId owner = AccountId.fromStored(AccountFixtures.persistMember(entityManager, "lan@x.vn"));
        AddressEntry added = add(owner, "12 Lê Lợi", AddressLabel.parse("Nhà riêng"), false);
        entityManager.clear();

        AddressEntry read = addressBooks.list(owner).get(0);

        assertEquals(added.id(), read.id());
        assertEquals(AddressFixtures.contact("12 Lê Lợi"), read.contact());
        assertEquals("Nhà riêng", read.label().orElseThrow().value());
        assertNotNull(read.getCreatedAt());
    }

    @Test
    void movingTheDefaultKeepsOneAndListsItFirst() throws InterruptedException {
        AccountId owner = AccountId.fromStored(AccountFixtures.persistMember(entityManager, "lan@x.vn"));
        AddressEntry old = add(owner, "old", null, false);
        Thread.sleep(5);
        // a new default clears the old one before it is inserted
        add(owner, "default", null, true);
        Thread.sleep(5);
        add(owner, "newest", null, false);
        entityManager.clear();

        assertEquals(List.of("default", "newest", "old"), details(owner));

        // an edited default is written after the old one is cleared
        addressBooks.load(owner).edit(old.id(), AddressFixtures.contact("old"), null, true);
        addressBooks.flush();
        entityManager.clear();

        assertEquals(List.of("old", "newest", "default"), details(owner));
        assertEquals(
                1,
                addressBooks.list(owner).stream()
                        .filter(AddressEntry::isDefault)
                        .count());
    }

    @Test
    void removedAddressIsGone() {
        AccountId owner = AccountId.fromStored(AccountFixtures.persistMember(entityManager, "lan@x.vn"));
        AddressEntry entry = add(owner, "12 Lê Lợi", null, false);
        entityManager.clear();

        AddressBook book = addressBooks.load(owner);
        addressBooks.remove(book.remove(entry.id()).orElseThrow());
        addressBooks.flush();

        assertEquals(List.of(), addressBooks.list(owner));
    }

    private AddressEntry add(AccountId owner, String detail, AddressLabel label, boolean makeDefault) {
        AddressEntry entry = addressBooks
                .load(owner)
                .add(new AddressId(UUID.randomUUID()), AddressFixtures.contact(detail), label, makeDefault);
        addressBooks.add(entry);
        return entry;
    }

    private List<String> details(AccountId owner) {
        return addressBooks.list(owner).stream()
                .map(entry -> entry.contact().location().detail().value())
                .toList();
    }
}
