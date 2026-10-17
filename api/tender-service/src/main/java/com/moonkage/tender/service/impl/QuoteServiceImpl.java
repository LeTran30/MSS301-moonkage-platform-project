package com.moonkage.tender.service.impl;

import com.moonkage.tender.repository.AuditLogRepository;
import com.moonkage.tender.repository.QuoteRepository;
import com.moonkage.tender.service.QuoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class QuoteServiceImpl implements QuoteService {

    private final QuoteRepository quoteRepository;
    private final AuditLogRepository auditLogRepository;
}
