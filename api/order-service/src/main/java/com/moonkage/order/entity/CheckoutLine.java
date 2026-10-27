package com.moonkage.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One product of a checkout, at the price vendor-service held it at (BR-19). */
@Entity
@Table(name = "checkout_lines")
@IdClass(CheckoutLine.Key.class)
@Getter
@Setter
@NoArgsConstructor
public class CheckoutLine {

    @Id
    @Column(name = "checkout_id", length = 36)
    private String checkoutId;

    @Id
    @Column(name = "line_no")
    private Integer lineNo;

    @Column(nullable = false, length = 36)
    private String vendorId;

    @Column(nullable = false, length = 36)
    private String productId;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false)
    private Long unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    @EqualsAndHashCode
    @NoArgsConstructor
    public static class Key implements Serializable {
        private static final long serialVersionUID = 1L;

        private String checkoutId;
        private Integer lineNo;
    }
}
