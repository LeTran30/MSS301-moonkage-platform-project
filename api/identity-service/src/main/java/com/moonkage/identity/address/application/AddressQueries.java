package com.moonkage.identity.address.application;

import com.moonkage.identity.address.application.port.AddressBookRepository;
import com.moonkage.identity.address.domain.AddressEntry;
import com.moonkage.identity.shared.AccountId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-03: what the caller reads about their own addresses. */
@Service
@RequiredArgsConstructor
class AddressQueries {

    private final AddressBookRepository addressBooks;

    /** The default first, then the newest. */
    @Transactional(readOnly = true)
    List<AddressEntry> list(AccountId owner) {
        return addressBooks.list(owner);
    }
}
