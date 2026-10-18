package com.moonkage.notification.infrastructure.persistence;

import com.moonkage.notification.application.port.AuditLogRepository;
import com.moonkage.notification.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JpaAuditLogRepository extends JpaRepository<AuditLog, String>, AuditLogRepository {}
