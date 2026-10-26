package com.moonkage.identity.address;

import com.moonkage.identity.address.dto.AddressResponse;
import com.moonkage.identity.address.dto.SaveAddressRequest;
import java.util.List;

public interface AddressService {

    List<AddressResponse> getMyAddresses(String accountId);

    AddressResponse create(String accountId, SaveAddressRequest request);

    AddressResponse update(String accountId, String addressId, SaveAddressRequest request);

    void delete(String accountId, String addressId);
}
