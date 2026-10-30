package com.moonkage.identity.address.application;

import com.moonkage.identity.address.AddressError;
import com.moonkage.identity.address.application.port.AddressBookRepository;
import com.moonkage.identity.address.domain.AddressId;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-03: deletes one address of the caller. Orders copied it, so they keep theirs. */
@Service
@RequiredArgsConstructor
class RemoveAddress {

    private final AddressBookRepository addressBooks;

    @Transactional
    void handle(AccountId owner, AddressId address) {
        addressBooks.remove(addressBooks
                .load(owner)
                .remove(address)
                .orElseThrow(() -> new AppException(AddressError.NOT_FOUND, address.toString())));
    }
}
