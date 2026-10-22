package com.moonkage.identity.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.moonkage.identity.dto.request.SaveAddressRequest;
import com.moonkage.identity.dto.response.AddressResponse;
import com.moonkage.identity.entity.Account;
import com.moonkage.identity.entity.Address;
import com.moonkage.identity.exception.AppException;
import com.moonkage.identity.exception.ErrorCode;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.repository.AddressRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AddressServiceImplTest {

    private static final String ACCOUNT_ID = "acc1";

    private AddressRepository addressRepository;
    private AccountRepository accountRepository;
    private AddressServiceImpl service;
    private final List<Address> stored = new ArrayList<>();

    @BeforeEach
    void setUp() {
        addressRepository = mock(AddressRepository.class);
        accountRepository = mock(AccountRepository.class);
        Account account = Account.builder().id(ACCOUNT_ID).build();
        when(accountRepository.findByIdForUpdate(ACCOUNT_ID)).thenReturn(Optional.of(account));
        when(addressRepository.findByAccountIdOrderByIsDefaultDescCreatedAtDesc(ACCOUNT_ID))
                .thenAnswer(inv -> List.copyOf(stored));
        when(addressRepository.saveAndFlush(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId("a" + (stored.size() + 1));
                stored.add(a);
            }
            return a;
        });
        when(addressRepository.findByIdAndAccountId(any(), any()))
                .thenAnswer(inv -> stored.stream()
                        .filter(a -> a.getId().equals(inv.getArgument(0)) && ACCOUNT_ID.equals(inv.getArgument(1)))
                        .findFirst());
        service = new AddressServiceImpl(addressRepository, accountRepository);
    }

    private static SaveAddressRequest request(Boolean isDefault) {
        return SaveAddressRequest.builder()
                .recipientName("  Nguyễn Lan  ")
                .recipientPhone("+84912345678")
                .provinceCode("79")
                .provinceName(" Thành phố Hồ Chí Minh ")
                .wardName(" Phường Sài Gòn ")
                .detail("  12 Lê Lợi  ")
                .label("   ")
                .isDefault(isDefault)
                .build();
    }

    private long defaults() {
        return stored.stream().filter(Address::isDefault).count();
    }

    @Test
    void firstAddressBecomesDefaultAndIsNormalized() {
        AddressResponse first = service.create(ACCOUNT_ID, request(null));
        assertTrue(first.isDefault());
        assertEquals("Nguyễn Lan", first.recipientName());
        assertEquals("0912345678", first.recipientPhone());
        assertEquals("Phường Sài Gòn", first.wardName());
        assertEquals("12 Lê Lợi", first.detail());
        assertNull(first.label());
    }

    @Test
    void deliveryAreaIsTheProvinceAndFullAddressReadsBottomUp() {
        AddressResponse address = service.create(ACCOUNT_ID, request(null));
        assertEquals("79", address.areaCode());
        assertEquals("12 Lê Lợi, Phường Sài Gòn, Thành phố Hồ Chí Minh", address.fullAddress());
    }

    @Test
    void newDefaultTakesOverFromOldOne() {
        service.create(ACCOUNT_ID, request(null));
        AddressResponse second = service.create(ACCOUNT_ID, request(false));
        assertFalse(second.isDefault());

        service.create(ACCOUNT_ID, request(true));
        assertEquals(1, defaults());
        assertTrue(stored.get(2).isDefault());
    }

    @Test
    void updateToDefaultClearsTheOthers() {
        service.create(ACCOUNT_ID, request(null));
        service.create(ACCOUNT_ID, request(null));
        service.update(ACCOUNT_ID, "a2", request(true));
        assertEquals(1, defaults());
        assertTrue(stored.get(1).isDefault());
    }

    @Test
    void updateWithoutFlagKeepsDefault() {
        service.create(ACCOUNT_ID, request(null));
        service.update(ACCOUNT_ID, "a1", request(null));
        assertTrue(stored.get(0).isDefault());
    }

    @Test
    void addressOfAnotherUserIsNotFound() {
        service.create(ACCOUNT_ID, request(null));
        Account otherAccount = Account.builder().id("other").build();
        when(accountRepository.findByIdForUpdate("other")).thenReturn(Optional.of(otherAccount));

        AppException exUpdate = assertThrows(AppException.class, () -> service.update("other", "a1", request(null)));
        assertEquals(ErrorCode.ADDRESS_NOT_FOUND, exUpdate.getErrorCode());

        AppException exDelete = assertThrows(AppException.class, () -> service.delete("other", "a1"));
        assertEquals(ErrorCode.ADDRESS_NOT_FOUND, exDelete.getErrorCode());
    }
}
