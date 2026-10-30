package com.moonkage.identity.address.application;

import com.moonkage.identity.address.application.port.AddressBookRepository;
import com.moonkage.identity.address.domain.AddressEntry;
import com.moonkage.identity.address.domain.AddressId;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.id.IdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-03: saves a new delivery address; the first one, or one asked to be, becomes the default (AC-03.1). */
@Service
@RequiredArgsConstructor
class AddAddress {

    private final AddressBookRepository addressBooks;
    private final IdGenerator idGenerator;

    @Transactional
    AddressEntry handle(AccountId owner, ParsedAddress address) {
        AddressEntry entry = addressBooks
                .load(owner)
                .add(
                        new AddressId(idGenerator.next()),
                        address.contact(),
                        address.label(),
                        Boolean.TRUE.equals(address.isDefault()));
        addressBooks.add(entry);
        return entry;
    }
}
