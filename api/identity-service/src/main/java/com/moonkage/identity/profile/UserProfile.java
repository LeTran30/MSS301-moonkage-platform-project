package com.moonkage.identity.profile;

import com.moonkage.identity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * What the person shows inside the platform (FR-01). Shares the account's id, so the whole system knows one id
 * per person. Login identifiers (email, phone) live only on Account; the NFC-verified legal identity lives in
 * LegalProfile (FR-04). Package-private: other components go through {@link UserProfileService}.
 */
@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
class UserProfile extends BaseEntity {

    @Id
    @Column(name = "account_id", nullable = false, updatable = false)
    private String accountId;

    @Column(name = "full_name", nullable = false, length = ProfileConstant.MAX_FULL_NAME_LENGTH)
    private String fullName;

    @Column(name = "avatar_key")
    private String avatarKey;
}
