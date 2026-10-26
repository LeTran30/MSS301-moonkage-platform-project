package com.moonkage.quotation.entity;

import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.enums.InvitationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

/**
 * A vendor's slot on a request. A direct request gets one for its target vendor, so declining and quoting go the same
 * way for both request types (FR-16, FR-36).
 */
@Entity
@Table(name = "request_invitations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RequestInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "request_id", nullable = false)
    private String requestId;

    @Column(name = "vendor_id", nullable = false)
    private String vendorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status = InvitationStatus.PENDING;

    /** Mandatory when declined (AC-36.3). */
    @Column(name = "decline_reason", columnDefinition = "TEXT")
    private String declineReason;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public static RequestInvitation of(String requestId, String vendorId) {
        RequestInvitation invitation = new RequestInvitation();
        invitation.requestId = requestId;
        invitation.vendorId = vendorId;
        return invitation;
    }

    public boolean isDeclined() {
        return status == InvitationStatus.DECLINED;
    }

    /** AC-36.3. Only an unanswered invitation can be declined; a quoted one is withdrawn instead. */
    public void decline(String reason, Instant now) {
        if (status != InvitationStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION, InvitationStatus.DECLINED);
        }
        if (reason == null || reason.isBlank()) {
            throw new AppException(ErrorCode.DECLINE_REASON_REQUIRED);
        }
        this.status = InvitationStatus.DECLINED;
        this.declineReason = reason.strip();
        this.respondedAt = now;
    }

    public void markQuoted(Instant now) {
        if (isDeclined()) {
            throw new AppException(ErrorCode.INVITATION_DECLINED);
        }
        if (status == InvitationStatus.PENDING) {
            this.respondedAt = now;
        }
        this.status = InvitationStatus.QUOTED;
    }
}
