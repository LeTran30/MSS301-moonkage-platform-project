package com.moonkage.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Platform-wide immutable audit trail: who did what, when, values before/after (NFR-07).
 * Rows arrive as events from the other services; nothing updates or deletes them.
 */
@Entity
@Table(
        name = "audit_logs",
        indexes = {
            @Index(name = "idx_audit_target", columnList = "target_type, target_id"),
            @Index(name = "idx_audit_actor", columnList = "actor_account_id")
        })
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "source_service", nullable = false, updatable = false)
    private String sourceService;

    /** accounts.id of who did it; on a vendor this is always the owner (no staff accounts, NFR-07). */
    @Column(name = "actor_account_id", nullable = false, updatable = false)
    private String actorAccountId;

    @Column(nullable = false, updatable = false)
    private String action;

    @Column(name = "target_type", nullable = false, updatable = false)
    private String targetType;

    @Column(name = "target_id", nullable = false, updatable = false)
    private String targetId;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String beforeValue;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String afterValue;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String reason;

    /** When it happened in the source service. */
    @Column(nullable = false, updatable = false)
    private Instant occurredAt;

    /** When notification-service stored it. */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant receivedAt;
}
