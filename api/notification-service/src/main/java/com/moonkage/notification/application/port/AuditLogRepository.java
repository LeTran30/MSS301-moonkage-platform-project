package com.moonkage.notification.application.port;

import com.moonkage.notification.domain.AuditLog;

public interface AuditLogRepository {

    AuditLog save(AuditLog auditLog);
}
