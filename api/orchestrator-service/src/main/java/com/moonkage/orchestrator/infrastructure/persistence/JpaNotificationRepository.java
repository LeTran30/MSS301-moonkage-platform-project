package com.moonkage.orchestrator.infrastructure.persistence;

import com.moonkage.orchestrator.application.port.NotificationRepository;
import com.moonkage.orchestrator.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JpaNotificationRepository extends JpaRepository<Notification, String>, NotificationRepository {}
