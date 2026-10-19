package com.moonkage.identity.service;

import com.moonkage.identity.dto.request.SaveAddressRequest;
import com.moonkage.identity.dto.response.AddressResponse;
import java.util.List;

public interface AddressService {

    List<AddressResponse> getMyAddresses(String accountId);

    AddressResponse create(String accountId, SaveAddressRequest request);

    AddressResponse update(String accountId, String addressId, SaveAddressRequest request);

    void delete(String accountId, String addressId);
}
