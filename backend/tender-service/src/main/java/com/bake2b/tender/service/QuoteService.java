package com.bake2b.tender.service;

import com.bake2b.tender.repository.QuoteRepository;
import com.bake2b.tender.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-17, FR-18, FR-37, FR-38. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final AuditLogRepository auditLogRepository;
}
