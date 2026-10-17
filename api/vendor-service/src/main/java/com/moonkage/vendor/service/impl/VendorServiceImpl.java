package com.moonkage.vendor.service.impl;

import com.moonkage.vendor.dto.response.VendorResponse;
import com.moonkage.vendor.mapper.VendorMapper;
import com.moonkage.vendor.repository.VendorRepository;
import com.moonkage.vendor.service.VendorService;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<VendorResponse> findByOwnerAccountId(String accountId) {
        return vendorRepository.findByOwnerAccountId(accountId).map(VendorMapper::toResponse);
    }
}
