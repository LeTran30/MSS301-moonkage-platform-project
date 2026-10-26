package com.moonkage.vendor.registrationfee;

import com.moonkage.vendor.common.vo.Price;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

/**
 * One level of the registration fee from {@code effectiveFrom} on (FR-53, BR-31). A change adds a row, so every
 * level ever charged stays readable (AC-53.2).
 */
@Entity
@Immutable
@Table(name = "registration_fee_configs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class RegistrationFeeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private Price amount;

    @Column(nullable = false)
    private Instant effectiveFrom;

    /** Admin account that set it; null for the default level of the migration. */
    @Column(length = 36)
    private String createdBy;

    static RegistrationFeeConfig of(Price amount, Instant effectiveFrom, String createdBy) {
        RegistrationFeeConfig config = new RegistrationFeeConfig();
        config.amount = amount;
        config.effectiveFrom = effectiveFrom;
        config.createdBy = createdBy;
        return config;
    }
}
