package com.moonkage.notification.repository;

import com.moonkage.notification.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {}
