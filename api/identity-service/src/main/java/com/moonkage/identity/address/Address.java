package com.moonkage.identity.address;

import com.moonkage.identity.account.atom.PhoneNumber;
import com.moonkage.identity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Saved delivery address of an account (FR-03). At most one default per account. Timestamps come from BaseEntity
 * (Instant, so the API returns them with a time zone, Software Design 5.1 rule 7).
 */
@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
class Address extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** = accounts.id; an id, not a relation, so the Account entity stays inside its component. */
    @Column(name = "account_id", nullable = false, updatable = false)
    private String accountId;

    @Column(nullable = false, length = AddressConstant.MAX_RECIPIENT_NAME_LENGTH)
    private String recipientName;

    /** The 9 subscriber digits, like accounts.phone_number; {@link PhoneNumber#toNational()} is what shippers dial. */
    @Column(nullable = false, length = 10)
    private PhoneNumber recipientPhone;

    @Column(nullable = false, length = AddressConstant.PROVINCE_CODE_DIGITS)
    private String provinceCode;

    @Column(nullable = false, length = AddressConstant.MAX_ADMINISTRATIVE_UNIT_NAME_LENGTH)
    private String provinceName;

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

    public void setRecipientPhone(PhoneNumber recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone == null ? null : PhoneNumber.of(recipientPhone);
    }

    public String getRecipientPhone() {
        return recipientPhone == null ? null : recipientPhone.value();
    }

    public PhoneNumber recipientPhone() {
        return recipientPhone;
    }

    public String getAreaCode() {
        return provinceCode;
    }
}
