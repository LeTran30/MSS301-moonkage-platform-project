package com.moonkage.identity.entity;

import com.moonkage.identity.constant.IdCardConstant;
import com.moonkage.identity.enums.Gender;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Result of the NFC verification (FR-04, AC-04.11). A row means the account is verified (D-21). Only these fields
 * are kept; place of birth, place of residence, issue and expiry date are dropped right after the checks.
 */
@Entity
@Table(
        name = "legal_profiles",
        // BR-23: one ID card, one account
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_legal_profiles_id_hash",
                        columnNames = {"id_number_hash", "id_hash_key_ver"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalProfile extends BaseEntity {

    /** = accounts.id */
    @Id
    @Column(name = "account_id")
    private String accountId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id")
    private Account account;

    /** Upper case, no diacritics, as on the card (A-08). */
    @Column(name = "legal_name", nullable = false, length = IdCardConstant.MAX_LEGAL_NAME_LENGTH)
    private String legalName;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false, length = 10)
    private Gender gender;

    @Column(name = "nationality", nullable = false, length = IdCardConstant.MAX_NATIONALITY_LENGTH)
    private String nationality;

    /** Hex HMAC-SHA256(pepper[idHashKeyVer], 12-digit ID number). */
    @Column(name = "id_number_hash", nullable = false, length = 64)
    private String idNumberHash;

    @Column(name = "id_hash_key_ver", nullable = false)
    private Integer idHashKeyVer;

    /** e.g. ********1234 (AC-04.12) */
    @Column(name = "id_number_masked", nullable = false, length = IdCardConstant.ID_NUMBER_DIGITS)
    private String idNumberMasked;

    /** AES-256-GCM(pii key[piiKeyVer]): IV followed by ciphertext and tag. */
    @Column(name = "id_number_enc", nullable = false)
    private byte[] idNumberEnc;

    @Column(name = "date_of_birth_enc", nullable = false)
    private byte[] dateOfBirthEnc;

    @Column(name = "pii_key_ver", nullable = false)
    private Integer piiKeyVer;

    @Column(name = "nfc_verified_at", nullable = false)
    private Instant nfcVerifiedAt;
}
