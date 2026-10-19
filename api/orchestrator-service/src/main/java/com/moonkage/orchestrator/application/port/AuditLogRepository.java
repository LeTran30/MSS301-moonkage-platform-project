package com.moonkage.orchestrator.application.port;

import com.moonkage.orchestrator.domain.AuditLog;

public interface AuditLogRepository {

    AuditLog save(AuditLog auditLog);
}
