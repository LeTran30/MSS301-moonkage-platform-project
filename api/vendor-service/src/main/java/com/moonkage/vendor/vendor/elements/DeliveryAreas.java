package com.moonkage.vendor.vendor.vo;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.ProvinceCode;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.SortedSet;
import java.util.TreeSet;

/**
 * Provinces a vendor delivers to at its own flat fee (FR-28, AC-28.1, Q-12: the province is the unit). At least one;
 * a province listed twice counts once. Kept in code order.
 */
public record DeliveryAreas(SortedSet<ProvinceCode> provinces) {

    private static final Comparator<ProvinceCode> BY_CODE = Comparator.comparing(ProvinceCode::value);

    public DeliveryAreas {
        if (provinces == null || provinces.isEmpty()) {
            throw new AppException(ErrorCode.DELIVERY_AREAS_INVALID);
        }
        SortedSet<ProvinceCode> copy = new TreeSet<>(BY_CODE);
        copy.addAll(provinces);
        provinces = Collections.unmodifiableSortedSet(copy);
    }

    /** Each code is checked as a {@link ProvinceCode}. */
    public static DeliveryAreas of(List<String> provinceCodes) {
        if (provinceCodes == null) {
            throw new AppException(ErrorCode.DELIVERY_AREAS_INVALID);
        }
        SortedSet<ProvinceCode> provinces = new TreeSet<>(BY_CODE);
        provinceCodes.forEach(code -> provinces.add(ProvinceCode.of(code)));
        return new DeliveryAreas(provinces);
    }

    public boolean contains(ProvinceCode province) {
        return provinces.contains(province);
    }

    public List<String> codes() {
        return provinces.stream().map(ProvinceCode::value).toList();
    }
}
