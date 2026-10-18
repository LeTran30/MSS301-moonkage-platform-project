package com.moonkage.notification.infrastructure.persistence;

import com.moonkage.notification.application.port.NotificationRepository;
import com.moonkage.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JpaNotificationRepository extends JpaRepository<Notification, String>, NotificationRepository {}
