package com.bake2b.tender.service.impl;

import com.bake2b.tender.repository.QuoteRepository;
import com.bake2b.tender.repository.AuditLogRepository;
import com.bake2b.tender.service.QuoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-17, FR-18, FR-37, FR-38. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class QuoteServiceImpl implements QuoteService {

    private final QuoteRepository quoteRepository;
    private final AuditLogRepository auditLogRepository;
}
