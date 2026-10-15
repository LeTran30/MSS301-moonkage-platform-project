package com.bake2b.identity.service.impl;

import com.bake2b.identity.repository.VendorRepository;
import com.bake2b.identity.repository.VendorDocumentRepository;
import com.bake2b.identity.repository.AuditLogRepository;
import com.bake2b.identity.service.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;
    private final VendorDocumentRepository vendorDocumentRepository;
    private final AuditLogRepository auditLogRepository;
}
