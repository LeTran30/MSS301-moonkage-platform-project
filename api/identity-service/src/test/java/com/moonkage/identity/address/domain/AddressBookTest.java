package com.moonkage.identity.address.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.identity.shared.AccountId;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** AC-03.1: at most one default; the first address takes it; removing the default leaves none (decision D). */
class AddressBookTest {

    private static final AccountId LAN = AccountId.fromStored("6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10");
    private static final AccountId MAI = AccountId.fromStored("0b7e4c19-2f5a-4d8e-a613-9c4d2e8f7a55");
    private static final AddressLabel HOME = AddressLabel.parse("Nhà riêng");

    private final AddressBook book = AddressBook.of(LAN, List.of());

    @Test
    void firstAddressBecomesTheDefaultWhateverWasAsked() {
        AddressEntry first = add("1 Lê Lợi", false);

        assertTrue(first.isDefault());
        assertEquals(LAN, first.owner());
        assertEquals(HOME, first.label().orElseThrow());
    }

    @Test
    void newDefaultTakesTheFlagFromTheOldOne() {
        AddressEntry first = add("1 Lê Lợi", false);
        AddressEntry notDefault = add("2 Lê Lợi", false);
        AddressEntry newDefault = add("3 Lê Lợi", true);

        assertFalse(first.isDefault());
        assertFalse(notDefault.isDefault());
        assertTrue(newDefault.isDefault());
    }

    @Test
    void editMovesKeepsOrClearsTheFlag() {
        AddressEntry first = add("1 Lê Lợi", false);
        AddressEntry second = add("2 Lê Lợi", false);

        // null keeps the flag
        book.edit(second.id(), AddressFixtures.contact("2b Lê Lợi"), null, null);
        assertTrue(first.isDefault());
        assertFalse(second.isDefault());
        assertEquals("2b Lê Lợi", second.contact().location().detail().value());
        assertTrue(second.label().isEmpty());

        book.edit(second.id(), second.contact(), null, true);
        assertFalse(first.isDefault());
        assertTrue(second.isDefault());

        // false clears it: the book may have no default
        book.edit(second.id(), second.contact(), null, false);
        assertFalse(first.isDefault());
        assertFalse(second.isDefault());
    }

    @Test
    void removingTheDefaultLeavesNone() {
        AddressEntry first = add("1 Lê Lợi", false);
        AddressEntry second = add("2 Lê Lợi", false);

        assertEquals(first, book.remove(first.id()).orElseThrow());
        assertFalse(second.isDefault());
        assertTrue(book.remove(first.id()).isEmpty());
    }

    @Test
    void unknownAddressIsNotInTheBook() {
        AddressId unknown = new AddressId(UUID.randomUUID());

        assertTrue(book.edit(unknown, AddressFixtures.contact("1 Lê Lợi"), null, true)
                .isEmpty());
        assertTrue(book.remove(unknown).isEmpty());
    }

    @Test
    void bookHoldsOnlyItsOwnersAddresses() {
        AddressEntry lans = add("1 Lê Lợi", false);

        assertThrows(IllegalArgumentException.class, () -> AddressBook.of(MAI, List.of(lans)));
    }

    private AddressEntry add(String detail, boolean makeDefault) {
        return book.add(new AddressId(UUID.randomUUID()), AddressFixtures.contact(detail), HOME, makeDefault);
    }
}
