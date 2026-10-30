package com.moonkage.identity.address.domain;

import com.moonkage.identity.shared.AccountId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * The saved addresses of one account (FR-03), and every rule about its default (AC-03.1): at most one default; the
 * first address becomes it; removing the default leaves none (decision D). Another account's address is not in the
 * book, so it answers like a missing one. The "currently selected" address used for filtering (AC-03.2) is client
 * state, not kept here.
 */
public final class AddressBook {

    private final AccountId owner;
    private final List<AddressEntry> entries;

    private AddressBook(AccountId owner, List<AddressEntry> entries) {
        this.owner = owner;
        this.entries = entries;
    }

    /** The book as stored. Every entry must belong to {@code owner}. */
    public static AddressBook of(AccountId owner, List<AddressEntry> entries) {
        Objects.requireNonNull(owner, "owner");
        for (AddressEntry entry : entries) {
            if (!entry.owner().equals(owner)) {
                throw new IllegalArgumentException("address " + entry.id() + " is not in the book of " + owner);
            }
        }
        return new AddressBook(owner, new ArrayList<>(entries));
    }

    /** A new address; it becomes the default when asked to, or when it is the first one. */
    public AddressEntry add(AddressId id, DeliveryContact contact, AddressLabel label, boolean makeDefault) {
        AddressEntry entry = AddressEntry.create(id, owner, contact, label);
        boolean becomesDefault = makeDefault || entries.isEmpty();
        entries.add(entry);
        if (becomesDefault) {
            makeDefault(entry);
        }
        return entry;
    }

    /**
     * Replaces the content of an address.
     *
     * @param makeDefault true takes the default flag from the current default, false clears it (the book may then have
     *     no default), null keeps it as it is
     * @return empty when the book has no such address
     */
    public Optional<AddressEntry> edit(AddressId id, DeliveryContact contact, AddressLabel label, Boolean makeDefault) {
        Optional<AddressEntry> found = find(id);
        found.ifPresent(entry -> {
            entry.revise(contact, label);
            if (Boolean.TRUE.equals(makeDefault)) {
                makeDefault(entry);
            } else if (Boolean.FALSE.equals(makeDefault)) {
                entry.unmarkDefault();
            }
        });
        return found;
    }

    /**
     * Takes an address out of the book. Removing the default leaves the book with none.
     *
     * @return the removed address; empty when the book has no such address
     */
    public Optional<AddressEntry> remove(AddressId id) {
        Optional<AddressEntry> found = find(id);
        found.ifPresent(entries::remove);
        return found;
    }

    private Optional<AddressEntry> find(AddressId id) {
        return entries.stream().filter(entry -> entry.id().equals(id)).findFirst();
    }

    private void makeDefault(AddressEntry target) {
        for (AddressEntry entry : entries) {
            if (!entry.id().equals(target.id())) {
                entry.unmarkDefault();
            }
        }
        target.markDefault();
    }
}
