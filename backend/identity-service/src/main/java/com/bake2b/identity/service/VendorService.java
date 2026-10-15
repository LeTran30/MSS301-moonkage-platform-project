package com.bake2b.identity.service;

import com.bake2b.identity.dto.response.VendorInternalResponse;

import java.util.Optional;

public interface VendorService {

    Optional<VendorInternalResponse> findByOwnerUserId(String userId);
}
