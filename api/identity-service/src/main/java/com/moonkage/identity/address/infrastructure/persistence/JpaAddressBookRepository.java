package com.moonkage.identity.address.infrastructure.persistence;

import com.moonkage.identity.address.application.port.AddressBookRepository;
import com.moonkage.identity.address.domain.AddressBook;
import com.moonkage.identity.address.domain.AddressEntry;
import com.moonkage.identity.shared.AccountId;
import jakarta.persistence.EntityManager;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * Address books on the addresses table. A book is held with a PostgreSQL advisory lock on its account, not with a lock
 * on the accounts row, which belongs to another module. The partial unique index ux_addresses_one_default_per_account
 * is the last guard of one default per account.
 */
@Repository
@RequiredArgsConstructor
class JpaAddressBookRepository implements AddressBookRepository {

    /** First key of pg_advisory_xact_lock(int, int): keeps address book locks apart from any other kind. */
    private static final int ADDRESS_BOOK_LOCKS = 1;

    private final EntityManager entityManager;

    /**
     * Released when the transaction ends. Entries are read default first, so when a later flush writes their changes
     * in that order, the old default is cleared before a new one is set and the unique index never sees two.
     */
    @Override
    public AddressBook load(AccountId owner) {
        entityManager
                .createNativeQuery("SELECT 1 FROM pg_advisory_xact_lock(?1, hashtext(?2))")
                .setParameter(1, ADDRESS_BOOK_LOCKS)
                .setParameter(2, owner.toString())
                .getSingleResult();
        return AddressBook.of(owner, list(owner));
    }

    @Override
    public List<AddressEntry> list(AccountId owner) {
        return entityManager
                .createQuery(
                        "SELECT e FROM AddressEntry e WHERE e.accountId = :owner"
                                + " ORDER BY e.isDefault DESC, e.createdAt DESC",
                        AddressEntry.class)
                .setParameter("owner", owner.value())
                .getResultList();
    }

    /**
     * Hibernate runs inserts before updates, so the flag the book cleared on the old default is written first: the
     * new default would otherwise break the unique index (B-1). The second flush fills the timestamps.
     */
    @Override
    public void add(AddressEntry entry) {
        entityManager.flush();
        entityManager.persist(entry);
        entityManager.flush();
    }

    @Override
    public void remove(AddressEntry entry) {
        entityManager.remove(entry);
    }

    @Override
    public void flush() {
        entityManager.flush();
    }
}
