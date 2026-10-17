package com.moonkage.identity.service;

import com.moonkage.identity.dto.response.VendorInternalResponse;
import java.util.Optional;

public interface VendorService {

    Optional<VendorInternalResponse> findByOwnerUserId(String userId);
}
