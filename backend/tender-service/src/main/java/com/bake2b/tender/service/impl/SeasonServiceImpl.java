package com.bake2b.tender.service.impl;

import com.bake2b.tender.repository.SeasonRepository;
import com.bake2b.tender.repository.AuditLogRepository;
import com.bake2b.tender.service.SeasonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-53. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class SeasonServiceImpl implements SeasonService {

    private final SeasonRepository seasonRepository;
    private final AuditLogRepository auditLogRepository;
}
