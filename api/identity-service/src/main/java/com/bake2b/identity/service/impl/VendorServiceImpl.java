package com.bake2b.identity.service.impl;

import com.bake2b.identity.dto.response.VendorInternalResponse;
import com.bake2b.identity.repository.AuditLogRepository;
import com.bake2b.identity.repository.VendorDocumentRepository;
import com.bake2b.identity.repository.VendorRepository;
import com.bake2b.identity.service.VendorService;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;
    private final VendorDocumentRepository vendorDocumentRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<VendorInternalResponse> findByOwnerUserId(String userId) {
        return vendorRepository.findByOwnerId(userId).map(VendorInternalResponse::from);
    }
}
