package com.moonkage.vendor.vendor;

import com.moonkage.vendor.cakeattribute.CakeAttributeGroup;
import com.moonkage.vendor.cakeattribute.CakeAttributeRef;
import java.util.List;

/** The crusts and fillings something links, by code, as responses and events carry them (L-19). */
record CakeAttributeCodes(List<String> crusts, List<String> fillings) {

    /** Keeps the order of {@code values}. */
    static CakeAttributeCodes of(List<CakeAttributeRef> values) {
        return new CakeAttributeCodes(
                codesOf(values, CakeAttributeGroup.CRUST), codesOf(values, CakeAttributeGroup.FILLING));
    }

    private static List<String> codesOf(List<CakeAttributeRef> values, CakeAttributeGroup group) {
        return values.stream()
                .filter(value -> value.group() == group)
                .map(value -> value.code().value())
                .toList();
    }
}
