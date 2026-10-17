package com.moonkage.vendor.service;

import com.moonkage.vendor.dto.response.VendorResponse;
import java.util.Optional;

public interface VendorService {

    Optional<VendorResponse> findByOwnerAccountId(String accountId);
}
