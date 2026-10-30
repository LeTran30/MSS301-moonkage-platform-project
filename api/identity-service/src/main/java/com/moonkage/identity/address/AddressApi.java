package com.moonkage.identity.address;

import com.moonkage.identity.shared.AccountId;
import java.util.List;

/**
 * What other modules may ask of the address module (FR-03): the address book of one account, one default at most.
 * An address of another account answers like an unknown one. A draft is checked before the id, so a bad draft answers
 * 400 whatever the id; an id that is no UUID answers NOT_FOUND, echoing what was sent.
 */
public interface AddressApi {

    /** The default first, then the newest. */
    List<AddressView> list(AccountId owner);

    /** The first address, or one asked to be, becomes the default. */
    AddressView add(AccountId owner, AddressDraft draft);

    /** Replaces the whole address. Throws NOT_FOUND. */
    AddressView edit(AccountId owner, String addressId, AddressDraft draft);

    /** Removing the default leaves the book without one (decision D). Throws NOT_FOUND. */
    void remove(AccountId owner, String addressId);
}
