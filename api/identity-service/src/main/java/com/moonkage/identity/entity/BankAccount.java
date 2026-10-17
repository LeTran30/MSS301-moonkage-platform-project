package com.moonkage.identity.entity;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Bank account in the vendor's legal name (AC-26.1).
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class BankAccount {

    private String bankName;

    private String accountNumber;

    private String accountHolder;
}
