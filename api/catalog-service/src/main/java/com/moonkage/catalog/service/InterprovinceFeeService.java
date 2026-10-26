package com.moonkage.catalog.service;

import com.moonkage.catalog.dto.request.SaveInterprovinceFeesRequest;
import com.moonkage.catalog.dto.response.InterprovinceFeeResponse;
import com.moonkage.catalog.dto.response.InterprovinceFeeTableResponse;

public interface InterprovinceFeeService {
    InterprovinceFeeTableResponse replace(String accountId, String role, SaveInterprovinceFeesRequest request);

    InterprovinceFeeTableResponse getTable();

    InterprovinceFeeResponse getProvinceFee(String provinceCode);
}
