package com.moonkage.identity.address.application;

import com.moonkage.identity.address.AddressError;
import com.moonkage.identity.address.application.port.AddressBookRepository;
import com.moonkage.identity.address.domain.AddressEntry;
import com.moonkage.identity.address.domain.AddressId;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-03: replaces the content of one address of the caller, and may move or clear the default flag. */
@Service
@RequiredArgsConstructor
class EditAddress {

    private final AddressBookRepository addressBooks;

    @Transactional
    AddressEntry handle(AccountId owner, AddressId id, ParsedAddress address) {
        AddressEntry entry = addressBooks
                .load(owner)
                .edit(id, address.contact(), address.label(), address.isDefault())
                .orElseThrow(() -> new AppException(AddressError.NOT_FOUND, id.toString()));
        // the answer carries the new updatedAt
        addressBooks.flush();
        return entry;
    }
}
