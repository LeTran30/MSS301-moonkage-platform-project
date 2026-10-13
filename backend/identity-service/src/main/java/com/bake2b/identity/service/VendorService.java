package com.bake2b.identity.service;

import com.bake2b.identity.repository.VendorRepository;
import com.bake2b.identity.repository.VendorDocumentRepository;
import com.bake2b.identity.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-26, FR-27, FR-46, FR-47. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;
    private final VendorDocumentRepository vendorDocumentRepository;
    private final AuditLogRepository auditLogRepository;
}
