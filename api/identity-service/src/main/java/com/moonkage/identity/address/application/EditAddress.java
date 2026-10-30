package com.moonkage.identity.address.application;

import com.moonkage.identity.address.AddressError;
import com.moonkage.identity.address.application.port.AddressBookRepository;
import com.moonkage.identity.address.domain.AddressEntry;
import com.moonkage.identity.address.domain.AddressId;
import com.moonkage.identity.address.domain.AddressLabel;
import com.moonkage.identity.address.domain.DeliveryContact;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-03: replaces the content of one address of the caller, and may move or clear the default flag. */
@Service
@RequiredArgsConstructor
public class EditAddress {

    private final AddressBookRepository addressBooks;

    @Transactional
    public AddressEntry handle(Command command) {
        AddressEntry entry = addressBooks
                .load(command.owner())
                .edit(command.address(), command.contact(), command.label(), command.makeDefault())
                .orElseThrow(() -> new AppException(
                        AddressError.NOT_FOUND, command.address().toString()));
        // the answer carries the new updatedAt
        addressBooks.flush();
        return entry;
    }

    /**
     * @param label null when not given
     * @param makeDefault true takes the default flag, false clears it, null keeps it
     */
    public record Command(
            AccountId owner, AddressId address, DeliveryContact contact, AddressLabel label, Boolean makeDefault) {}
}
