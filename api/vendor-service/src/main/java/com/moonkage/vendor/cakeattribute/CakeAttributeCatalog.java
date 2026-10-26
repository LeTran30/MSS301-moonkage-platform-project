package com.moonkage.vendor.cakeattribute;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.util.List;
import java.util.Optional;

/**
 * The values of one group, loaded locked, so the rules across them hold: no two values share a label key or a code
 * (AC-54.1, AC-54.2), a new value goes last (AC-54.1), the group keeps at least one visible value (AC-54.5).
 */
final class CakeAttributeCatalog {

    private final CakeAttributeGroup group;
    private final List<CakeAttribute> values;

    CakeAttributeCatalog(CakeAttributeGroup group, List<CakeAttribute> values) {
        this.group = group;
        this.values = values;
    }

    /** A new visible value after every other one. */
    CakeAttribute add(CakeAttributeLabel label) {
        CakeAttributeCode code = label.toCode();
        findOther(null, label)
                .or(() -> values.stream().filter(v -> v.getCode().equals(code)).findFirst())
                .ifPresent(CakeAttributeCatalog::duplicate);
        int last = values.stream().mapToInt(CakeAttribute::getSortOrder).max().orElse(0);
        return CakeAttribute.create(group, label, last + 1);
    }

    void rename(CakeAttribute value, CakeAttributeLabel label) {
        findOther(value, label).ifPresent(CakeAttributeCatalog::duplicate);
        value.rename(label);
    }

    void hide(CakeAttribute value) {
        boolean otherVisible =
                values.stream().anyMatch(v -> v.isActive() && !v.getId().equals(value.getId()));
        if (value.isActive() && !otherVisible) {
            throw new AppException(ErrorCode.LAST_VISIBLE_CAKE_ATTRIBUTE);
        }
        value.hide();
    }

    /** A value other than {@code value} (null: none excluded) with the same key, the one to name (AC-54.2). */
    private Optional<CakeAttribute> findOther(CakeAttribute value, CakeAttributeLabel label) {
        String key = label.key();
        return values.stream()
                .filter(v -> value == null || !v.getId().equals(value.getId()))
                .filter(v -> v.getLabelKey().equals(key))
                .findFirst();
    }

    private static void duplicate(CakeAttribute existing) {
        throw new AppException(
                ErrorCode.CAKE_ATTRIBUTE_DUPLICATE, existing.getLabel().value());
    }
}
