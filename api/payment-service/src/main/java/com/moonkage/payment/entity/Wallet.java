package com.moonkage.payment.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

/** A buyer's wallet. The balance is the sum of its entries, checked by the database at commit. */
@Entity
@Table(name = "wallets")
@Getter
@Setter
@NoArgsConstructor
public class Wallet {

    /** accounts.id in identity-service; no FK across services. */
    @Id
    @Column(length = 36)
    private String accountId;

    @Column(nullable = false)
    private Long balance = 0L;

    @Version
    @Column(nullable = false)
    private Long version;

    @UpdateTimestamp
    private Instant updatedAt;

    /** A new, empty wallet of the account. */
    public Wallet(String accountId) {
        this.accountId = accountId;
    }
}
