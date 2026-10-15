package com.bake2b.identity.repository;

import com.bake2b.identity.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {}
