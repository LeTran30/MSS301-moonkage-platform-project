package com.bake2b.order.entity;

import com.bake2b.order.enums.DisputeParty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Evidence file from either party (AC-51.1).
 */
@Entity
@Table(name = "dispute_evidences")
@Getter
@Setter
@NoArgsConstructor
public class DisputeEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisputeParty party;

    @Column(nullable = false)
    private String fileUrl;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
