package com.moonkage.identity.service.impl;

import com.moonkage.identity.dto.response.VendorInternalResponse;
import com.moonkage.identity.repository.AuditLogRepository;
import com.moonkage.identity.repository.VendorDocumentRepository;
import com.moonkage.identity.repository.VendorRepository;
import com.moonkage.identity.service.VendorService;
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
