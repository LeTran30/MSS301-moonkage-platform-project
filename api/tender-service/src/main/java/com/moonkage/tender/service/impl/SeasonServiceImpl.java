package com.moonkage.tender.service.impl;

import com.moonkage.tender.repository.AuditLogRepository;
import com.moonkage.tender.repository.SeasonRepository;
import com.moonkage.tender.service.SeasonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SeasonServiceImpl implements SeasonService {

    private final SeasonRepository seasonRepository;
    private final AuditLogRepository auditLogRepository;
}
