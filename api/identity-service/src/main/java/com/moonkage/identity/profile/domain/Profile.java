package com.moonkage.identity.profile.domain;

import com.moonkage.identity.platform.persistence.BaseEntity;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.IdNumberHash;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.LegalName;
import com.moonkage.identity.shared.MaskedIdNumber;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Who a person is (plan v2, 4.3): the name they chose and, after KYC, who they are by law. Shares the account's id.
 * Created by {@link #create}; the legal identity is written once by {@link #completeKyc} and never changes.
 *
 * <p>The four legal columns are all null before KYC and all set after it, as {@code ck_profiles_kyc_complete}
 * repeats in the database.
 */
@Entity
@Table(
        name = "profiles",
        uniqueConstraints = @UniqueConstraint(name = Profile.ID_NUMBER_HASH_UNIQUE_KEY, columnNames = "id_number_hash"))
public class Profile extends BaseEntity {

    /** BR-23: one ID card, one account. */
    public static final String ID_NUMBER_HASH_UNIQUE_KEY = "uk_profiles_id_number_hash";

    /** The {@link AccountId}: the profile has no id of its own. */
    @Id
    @Column(name = "account_id", nullable = false, updatable = false)
    private UUID accountId;

    @Column(name = "full_name", nullable = false, length = FullName.MAX_LENGTH)
    private FullName fullName;

    @Column(name = "kyc_verified", nullable = false)
    private boolean kycVerified;

    @Column(name = "legal_name", length = LegalName.MAX_LENGTH)
    private LegalName legalName;

    @Column(name = "id_number_hash", length = IdNumberHash.LENGTH)
    private IdNumberHash idNumberHash;

    @Column(name = "id_hash_key_ver")
    private Integer idHashKeyVersion;

    @Column(name = "id_number_masked", length = MaskedIdNumber.LENGTH)
    private MaskedIdNumber idNumberMasked;

    /** For JPA only. */
    protected Profile() {}

    private Profile(AccountId accountId, FullName fullName) {
        this.accountId = Objects.requireNonNull(accountId, "accountId").value();
        this.fullName = Objects.requireNonNull(fullName, "fullName");
        this.kycVerified = false;
    }

    /** FR-01: the profile of a new account, before KYC. */
    public static Profile create(AccountId accountId, FullName fullName) {
        return new Profile(accountId, fullName);
    }

    /**
     * FR-04: the card passed every check. The use case asks {@link #isKycVerified()} first, so a second call is a bug.
     */
    public void completeKyc(LegalIdentity identity) {
        Objects.requireNonNull(identity, "identity");
        if (kycVerified) {
            throw new IllegalStateException("KYC of " + accountId + " is already complete");
        }
        this.kycVerified = true;
        this.legalName = identity.legalName();
        this.idNumberHash = identity.idNumberHash();
        this.idHashKeyVersion = identity.hashKeyVersion();
        this.idNumberMasked = identity.idNumberMasked();
    }

    public AccountId accountId() {
        return new AccountId(accountId);
    }

    public FullName fullName() {
        return fullName;
    }

    public boolean isKycVerified() {
        return kycVerified;
    }

    /** Empty before KYC. */
    public Optional<LegalIdentity> legalIdentity() {
        return kycVerified
                ? Optional.of(new LegalIdentity(legalName, idNumberHash, idHashKeyVersion, idNumberMasked))
                : Optional.empty();
    }
}
