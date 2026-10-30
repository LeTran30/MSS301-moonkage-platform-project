package com.moonkage.identity.address.application;

import com.moonkage.identity.address.application.port.AddressBookRepository;
import com.moonkage.identity.address.domain.AddressEntry;
import com.moonkage.identity.address.domain.AddressId;
import com.moonkage.identity.address.domain.AddressLabel;
import com.moonkage.identity.address.domain.DeliveryContact;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.id.IdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-03: saves a new delivery address; the first one, or one asked to be, becomes the default (AC-03.1). */
@Service
@RequiredArgsConstructor
public class AddAddress {

    private final AddressBookRepository addressBooks;
    private final IdGenerator idGenerator;

    @Transactional
    public AddressEntry handle(Command command) {
        AddressEntry entry = addressBooks
                .load(command.owner())
                .add(new AddressId(idGenerator.next()), command.contact(), command.label(), command.makeDefault());
        addressBooks.add(entry);
        return entry;
    }

    /** @param label null when not given */
    public record Command(AccountId owner, DeliveryContact contact, AddressLabel label, boolean makeDefault) {}
}
