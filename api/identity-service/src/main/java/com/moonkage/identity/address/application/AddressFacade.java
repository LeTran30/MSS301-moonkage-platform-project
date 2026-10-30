package com.moonkage.identity.address.application;

import com.moonkage.identity.address.AddressApi;
import com.moonkage.identity.address.AddressDraft;
import com.moonkage.identity.address.AddressError;
import com.moonkage.identity.address.AddressView;
import com.moonkage.identity.address.domain.AddressEntry;
import com.moonkage.identity.address.domain.AddressId;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** The module's one door for other modules: each call goes to its use case or to the queries. */
@Service
@RequiredArgsConstructor
class AddressFacade implements AddressApi {

    private final AddressQueries queries;
    private final AddAddress addAddress;
    private final EditAddress editAddress;
    private final RemoveAddress removeAddress;

    @Override
    public List<AddressView> list(AccountId owner) {
        return queries.list(owner).stream().map(AddressEntry::view).toList();
    }

    @Override
    public AddressView add(AccountId owner, AddressDraft draft) {
        return addAddress.handle(owner, ParsedAddress.of(draft)).view();
    }

    @Override
    public AddressView edit(AccountId owner, String addressId, AddressDraft draft) {
        ParsedAddress address = ParsedAddress.of(draft);
        return editAddress.handle(owner, addressId(addressId), address).view();
    }

    @Override
    public void remove(AccountId owner, String addressId) {
        removeAddress.handle(owner, addressId(addressId));
    }

    /** An id that is no UUID cannot be in any book: it answers like an unknown one, echoing what was sent. */
    private static AddressId addressId(String raw) {
        return AddressId.tryParse(raw).orElseThrow(() -> new AppException(AddressError.NOT_FOUND, raw));
    }
}
