package com.moonkage.identity.address;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.address.dto.AddAddressRequest;
import com.moonkage.identity.address.dto.AddAddressResponse;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AddressServiceImplTest {

    private static final String ACCOUNT_ID = "6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10";
    private static final String OTHER_ACCOUNT_ID = "0b7e4c19-2f5a-4d8e-a613-9c4d2e8f7a55";

    private AddressRepository addressRepository;
    private AccountService accountService;
    private AddressServiceImpl service;
    private final List<Address> stored = new ArrayList<>();

    @BeforeEach
    void setUp() {
        addressRepository = mock(AddressRepository.class);
        accountService = mock(AccountService.class);
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
        service = new AddressServiceImpl(addressRepository, accountService);
    }

    private static AddAddressRequest request(Boolean isDefault) {
        return AddAddressRequest.builder()
                .recipientName("  Nguyễn Lan  ")
                .recipientPhone("0912345678")
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
        AddAddressResponse first = service.create(ACCOUNT_ID, request(null));
        assertTrue(first.isDefault());
        assertEquals("Nguyễn Lan", first.recipientName());
        assertEquals("912345678", first.recipientPhone());
        assertEquals("Phường Sài Gòn", first.wardName());
        assertEquals("12 Lê Lợi", first.detail());
        assertNull(first.label());
    }

    @Test
    void deliveryAreaIsTheProvinceAndFullAddressReadsBottomUp() {
        AddAddressResponse address = service.create(ACCOUNT_ID, request(null));
        assertEquals("79", address.areaCode());
        assertEquals("12 Lê Lợi, Phường Sài Gòn, Thành phố Hồ Chí Minh", address.fullAddress());
    }

    @Test
    void newDefaultTakesOverFromOldOne() {
        service.create(ACCOUNT_ID, request(null));
        AddAddressResponse second = service.create(ACCOUNT_ID, request(false));
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
        AppException exUpdate =
                assertThrows(AppException.class, () -> service.update(OTHER_ACCOUNT_ID, "a1", request(null)));
        assertEquals(LegacyError.ADDRESS_NOT_FOUND, exUpdate.getErrorCode());

        AppException exDelete = assertThrows(AppException.class, () -> service.delete(OTHER_ACCOUNT_ID, "a1"));
        assertEquals(LegacyError.ADDRESS_NOT_FOUND, exDelete.getErrorCode());
    }
}
