package com.moonkage.identity.service;

import com.moonkage.identity.dto.request.AddressRequest;
import com.moonkage.identity.dto.response.AddressResponse;
import java.util.List;

public interface AddressService {

    List<AddressResponse> getMyAddresses(String accountId);

    AddressResponse create(String accountId, AddressRequest request);

    AddressResponse update(String accountId, String addressId, AddressRequest request);

    void delete(String accountId, String addressId);
}
