package com.moonkage.identity.address.application.port;

import com.moonkage.identity.address.domain.AddressBook;
import com.moonkage.identity.address.domain.AddressEntry;
import com.moonkage.identity.shared.AccountId;
import java.util.List;

/** Where address books are kept. Changes to loaded entries are written when the transaction ends, or on flush. */
public interface AddressBookRepository {

    /**
     * The book of {@code owner}, held for the rest of the transaction: two requests of the same account wait for each
     * other, so neither sees a default the other is moving (AC-03.1).
     */
    AddressBook load(AccountId owner);

    /** The addresses of {@code owner} without holding the book: the default first, then the newest. */
    List<AddressEntry> list(AccountId owner);

    /** Stores an entry just added to a loaded book, after every earlier change of that book. */
    void add(AddressEntry entry);

    void remove(AddressEntry entry);

    /** Writes pending changes now, so their timestamps can be read. */
    void flush();
}
