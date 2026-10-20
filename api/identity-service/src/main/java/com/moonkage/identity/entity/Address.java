package com.moonkage.identity.entity;

import com.moonkage.identity.constant.AddressConstant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Saved delivery address of an account (FR-03). At most one default per account. Timestamps come from BaseEntity
 * (Instant, so the API returns them with a time zone, Software Design 5.1 rule 7).
 *
 * <p>Two administrative levels (province, ward), as in Vietnam since 2025-07-01. Each level keeps its code, used for
 * matching, and its name as the user picked it, so the address still reads the same after a later rename.
 */
@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
public class Address extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false, length = AddressConstant.MAX_RECIPIENT_NAME_LENGTH)
    private String recipientName;

    /** National form 0xxxxxxxxx: the number the shipper dials. */
    @Column(nullable = false, length = 10)
    private String recipientPhone;

    @Column(nullable = false, length = AddressConstant.PROVINCE_CODE_DIGITS)
    private String provinceCode;

    @Column(nullable = false, length = AddressConstant.MAX_ADMINISTRATIVE_UNIT_NAME_LENGTH)
    private String provinceName;

    @Column(nullable = false, length = AddressConstant.WARD_CODE_DIGITS)
    private String wardCode;

    @Column(nullable = false, length = AddressConstant.MAX_ADMINISTRATIVE_UNIT_NAME_LENGTH)
    private String wardName;

    /** House number and street, below the ward. */
    @Column(nullable = false, length = AddressConstant.MAX_DETAIL_LENGTH)
    private String detail;

    /** Optional tag such as "Nhà riêng"; null when not set. */
    @Column(length = AddressConstant.MAX_LABEL_LENGTH)
    private String label;

    @Column(nullable = false)
    private boolean isDefault;

    /**
     * Key compared with seller delivery areas (FR-05, FR-28). The delivery area is a province (Q-12), so it is the
     * province code; callers use this name so they do not depend on that choice.
     */
    public String getAreaCode() {
        return provinceCode;
    }
}
