package com.moonkage.identity.address;

import com.moonkage.identity.address.dto.AddAddressRequest;
import com.moonkage.identity.address.dto.AddAddressResponse;
import java.util.List;

public interface AddressService {

    List<AddAddressResponse> getMyAddresses(String accountId);

    AddAddressResponse create(String accountId, AddAddressRequest request);

    AddAddressResponse update(String accountId, String addressId, AddAddressRequest request);

    void delete(String accountId, String addressId);
}
