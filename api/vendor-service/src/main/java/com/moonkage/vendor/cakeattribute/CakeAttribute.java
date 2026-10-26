package com.moonkage.vendor.cakeattribute;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.Collection;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * One crust or filling of the catalogue (FR-54, BR-34). Never deleted, only hidden (AC-54.4); its code never changes
 * (AC-54.1, AC-54.3). The rules across the values of a group live in {@link CakeAttributeCatalog}.
 */
@Entity
@Table(name = "cake_attributes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class CakeAttribute {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    private CakeAttributeGroup attributeGroup;

    @Column(nullable = false, updatable = false)
    private CakeAttributeCode code;

    @Column(nullable = false)
    private CakeAttributeLabel label;

    /** The key of the label, kept with it on every rename; unique per group in the database (AC-54.2). */
    @Column(nullable = false)
    private String labelKey;

    /** Position in the seller's picker and the buyer's filter, smaller first (AC-54.6). */
    @Column(nullable = false)
    private int sortOrder;

    /** false = hidden (AC-54.4). */
    @Column(nullable = false)
    private boolean active;

    @Version
    private long version;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    /** A new, visible value with the code built from its label (AC-54.1). */
    static CakeAttribute create(CakeAttributeGroup group, CakeAttributeLabel label, int sortOrder) {
        CakeAttribute attribute = new CakeAttribute();
        attribute.attributeGroup = group;
        attribute.code = label.toCode();
        attribute.active = true;
        attribute.rename(label);
        attribute.reorder(sortOrder);
        return attribute;
    }

    /** AC-54.3: products show the new name; the code and their links stay. */
    void rename(CakeAttributeLabel newLabel) {
        label = newLabel;
        labelKey = newLabel.key();
    }

    void reorder(int newSortOrder) {
        if (newSortOrder < 0) {
            throw new AppException(ErrorCode.SORT_ORDER_INVALID);
        }
        sortOrder = newSortOrder;
    }

    void hide() {
        active = false;
    }

    void show() {
        active = true;
    }

    /**
     * Can be linked by a product or an order profile that already links {@code linkedIds}: a visible value, or a
     * hidden one it already had, which it keeps (AC-33.6, AC-54.4).
     */
    boolean isSelectableBy(Collection<String> linkedIds) {
        return active || linkedIds.contains(id);
    }

    CakeAttributeRef toRef() {
        return new CakeAttributeRef(id, attributeGroup, code);
    }
}
