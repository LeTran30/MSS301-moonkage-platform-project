package com.moonkage.identity.entity;

import com.moonkage.identity.constant.AccountConstant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * What the person shows inside the platform (FR-01). Shares the account's id, so the whole system knows one id
 * per person. Login identifiers (email, phone) live only on Account; the NFC-verified legal identity will go to
 * LegalProfile (FR-04).
 */
@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile extends BaseEntity {

    /** = accounts.id */
    @Id
    @Column(name = "account_id")
    private String accountId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "full_name", nullable = false, length = AccountConstant.MAX_FULL_NAME_LENGTH)
    private String fullName;

    @Column(name = "avatar_key")
    private String avatarKey;
}
