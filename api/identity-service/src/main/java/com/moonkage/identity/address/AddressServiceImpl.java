package com.moonkage.identity.address;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.account.atom.PhoneNumber;
import com.moonkage.identity.address.dto.AddAddressRequest;
import com.moonkage.identity.address.dto.AddAddressResponse;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FR-03. Rules: at most one default per account (AC-03.1); the first address becomes the default;
 * deleting the default leaves none. Orders copy the address, so edits and deletes never touch them.
 * The "currently selected" address used for filtering (AC-03.2) is client state, not stored here.
 */
@Service
@RequiredArgsConstructor
class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final AccountService accountService;

    @Override
    @Transactional
    public AddAddressResponse create(String accountId, AddAddressRequest request) {
        // row lock on the account: two parallel requests cannot both leave a default (AC-03.1)
        accountService.lockForUpdate(accountId);
        List<Address> existingAddresses = addressRepository.findByAccountIdOrderByIsDefaultDescCreatedAtDesc(accountId);

        Address address = new Address();
        address.setAccountId(accountId);
        apply(address, request);
        boolean makeDefault = existingAddresses.isEmpty() || Boolean.TRUE.equals(request.isDefault());
        if (makeDefault) {
            clearDefaults(existingAddresses);
        }
        address.setDefault(makeDefault);

        // flush so the response carries the generated timestamps
        Address saved = addressRepository.saveAndFlush(address);
        return AddressMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddAddressResponse> getMyAddresses(String accountId) {
        return addressRepository.findByAccountIdOrderByIsDefaultDescCreatedAtDesc(accountId).stream()
                .map(AddressMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AddAddressResponse update(String accountId, String addressId, AddAddressRequest request) {
        accountService.lockForUpdate(accountId);
        Address address = getOwned(accountId, addressId);

        apply(address, request);
        if (Boolean.TRUE.equals(request.isDefault())) {
            clearOtherDefaults(accountId, addressId);
            address.setDefault(true);
        } else if (Boolean.FALSE.equals(request.isDefault())) {
            address.setDefault(false);
        }

        Address saved = addressRepository.saveAndFlush(address);
        return AddressMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(String accountId, String addressId) {
        addressRepository.delete(getOwned(accountId, addressId));
    }

    private static void apply(Address address, AddAddressRequest request) {
        address.setRecipientName(request.recipientName());
        address.setRecipientPhone(PhoneNumber.of(request.recipientPhone()));
        address.setProvinceCode(request.provinceCode());
        address.setProvinceName(request.provinceName());
        address.setWardName(request.wardName());
        address.setDetail(request.detail());
        address.setLabel(request.label());
    }

    private static void clearDefaults(List<Address> addresses) {
        addresses.forEach(a -> a.setDefault(false));
    }

    /** Another account's address answers like a missing one. */
    private Address getOwned(String accountId, String addressId) {
        return addressRepository
                .findByIdAndAccountId(addressId, accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND, addressId));
    }

    private void clearOtherDefaults(String accountId, String keptAddressId) {
        clearDefaults(addressRepository.findByAccountIdOrderByIsDefaultDescCreatedAtDesc(accountId).stream()
                .filter(a -> !a.getId().equals(keptAddressId))
                .toList());
    }
}
