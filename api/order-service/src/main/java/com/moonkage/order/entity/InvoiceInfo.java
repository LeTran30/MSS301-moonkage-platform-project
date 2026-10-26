package com.moonkage.order.entity;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Business invoice data typed per order; never a company record (FR-24, BR-07).
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class InvoiceInfo {

    private String invoiceName;

    private String invoiceTaxCode;

    private String invoiceAddress;

    private String invoiceEmail;
}
