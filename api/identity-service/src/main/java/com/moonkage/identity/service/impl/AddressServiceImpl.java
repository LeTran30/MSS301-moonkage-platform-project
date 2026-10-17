package com.moonkage.identity.service.impl;

import com.moonkage.identity.dto.request.AddressRequest;
import com.moonkage.identity.dto.response.AddressResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.Address;
import com.moonkage.identity.exception.ResourceNotFoundException;
import com.moonkage.identity.mapper.AddressMapper;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.AddressRepository;
import com.moonkage.identity.service.AddressService;
import java.util.List;
import java.util.Locale;
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
public class AddressServiceImpl implements AddressService {

    private static final String NOT_FOUND = "Không tìm thấy địa chỉ";

    private final AddressRepository addressRepository;
    private final AccountRepository accountRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getMyAddresses(String accountId) {
        return addressRepository.findByAccountIdOrderByIsDefaultDescCreatedAtDesc(accountId).stream()
                .map(AddressMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AddressResponse create(String accountId, AddressRequest request) {
        Account account = lockAccount(accountId);
        List<Address> existing = addressRepository.findByAccountIdOrderByIsDefaultDescCreatedAtDesc(accountId);

        Address address = new Address();
        address.setAccount(account);
        apply(address, request);
        boolean makeDefault = existing.isEmpty() || Boolean.TRUE.equals(request.getIsDefault());
        if (makeDefault) {
            existing.forEach(a -> a.setDefault(false));
        }
        address.setDefault(makeDefault);
        // flush so the response carries the generated timestamps
        return AddressMapper.toResponse(addressRepository.saveAndFlush(address));
    }

    @Override
    @Transactional
    public AddressResponse update(String accountId, String addressId, AddressRequest request) {
        lockAccount(accountId);
        Address address = findOwned(accountId, addressId);
        apply(address, request);
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.findByAccountIdOrderByIsDefaultDescCreatedAtDesc(accountId).stream()
                    .filter(a -> !a.getId().equals(addressId))
                    .forEach(a -> a.setDefault(false));
            address.setDefault(true);
        } else if (Boolean.FALSE.equals(request.getIsDefault())) {
            address.setDefault(false);
        }
        return AddressMapper.toResponse(addressRepository.saveAndFlush(address));
    }

    @Override
    @Transactional
    public void delete(String accountId, String addressId) {
        addressRepository.delete(findOwned(accountId, addressId));
    }

    private Account lockAccount(String accountId) {
        return accountRepository
                .findByIdForUpdate(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
    }

    /** Another account's address answers like a missing one. */
    private Address findOwned(String accountId, String addressId) {
        return addressRepository
                .findByIdAndAccountId(addressId, accountId)
                .orElseThrow(() -> new ResourceNotFoundException(NOT_FOUND));
    }

    private static void apply(Address address, AddressRequest request) {
        address.setDetail(request.getDetail().trim());
        address.setAreaCode(request.getAreaCode().trim().toUpperCase(Locale.ROOT));
    }
}
