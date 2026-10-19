package com.moonkage.orchestrator.infrastructure.persistence;

import com.moonkage.orchestrator.application.port.AuditLogRepository;
import com.moonkage.orchestrator.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JpaAuditLogRepository extends JpaRepository<AuditLog, String>, AuditLogRepository {}
