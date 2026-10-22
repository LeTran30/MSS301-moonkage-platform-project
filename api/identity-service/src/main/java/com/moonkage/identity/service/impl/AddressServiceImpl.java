package com.moonkage.identity.service.impl;

import com.moonkage.identity.constant.PhoneConstant;
import com.moonkage.identity.dto.request.SaveAddressRequest;
import com.moonkage.identity.dto.response.AddressResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.Address;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.mapper.AddressMapper;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.AddressRepository;
import com.moonkage.identity.service.AddressService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * FR-03. Rules: at most one default per account (AC-03.1); the first address becomes the default;
 * deleting the default leaves none. Orders copy the address, so edits and deletes never touch them.
 * The "currently selected" address used for filtering (AC-03.2) is client state, not stored here.
 */
@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final AccountRepository accountRepository;

    @Override
    @Transactional
    public AddressResponse create(String accountId, SaveAddressRequest request) {
        Account account = lockAccount(accountId);
        List<Address> existingAddresses = addressRepository.findByAccountIdOrderByIsDefaultDescCreatedAtDesc(accountId);

        Address address = new Address();
        address.setAccount(account);
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
    public List<AddressResponse> getMyAddresses(String accountId) {
        return addressRepository.findByAccountIdOrderByIsDefaultDescCreatedAtDesc(accountId).stream()
                .map(AddressMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AddressResponse update(String accountId, String addressId, SaveAddressRequest request) {
        lockAccount(accountId);
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

    /** Row lock on the account: two parallel requests cannot both leave a default (AC-03.1). */
    private Account lockAccount(String accountId) {
        return accountRepository
                .findByIdForUpdate(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNT_NOT_FOUND, accountId));
    }

    private static void apply(Address address, SaveAddressRequest request) {
        address.setRecipientName(request.recipientName().trim());
        address.setRecipientPhone(toNationalPhone(request.recipientPhone()));
        address.setProvinceCode(request.provinceCode());
        address.setProvinceName(request.provinceName().trim());
        address.setWardName(request.wardName().trim());
        address.setDetail(request.detail().trim());
        address.setLabel(StringUtils.hasText(request.label()) ? request.label().trim() : null);
    }

    /** 0912…, 84912… and +84912… all become 0912…, the form the shipper dials. */
    private static String toNationalPhone(String phone) {
        return PhoneConstant.NATIONAL_PREFIX + Account.toStoredPhoneNumber(phone);
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
