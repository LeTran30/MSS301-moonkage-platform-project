package com.moonkage.catalog.mapper;

import com.moonkage.catalog.dto.response.InterprovinceFeeResponse;
import com.moonkage.catalog.dto.response.InterprovinceFeeTableResponse;
import com.moonkage.catalog.entity.InterprovinceFee;
import com.moonkage.catalog.entity.Province;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public final class InterprovinceFeeMapper {
    private InterprovinceFeeMapper() {}

    public static InterprovinceFeeTableResponse toResponse(List<Province> provinces, List<InterprovinceFee> fees) {
        Map<String, InterprovinceFee> byCode =
                fees.stream().collect(Collectors.toMap(InterprovinceFee::provinceCode, Function.identity()));
        List<InterprovinceFeeResponse> rows = provinces.stream()
                .map(province -> {
                    InterprovinceFee fee = byCode.get(province.code());
                    return new InterprovinceFeeResponse(
                            province.code(),
                            province.name(),
                            fee == null ? null : fee.fee(),
                            fee == null ? null : fee.effectiveFrom());
                })
                .toList();
        return new InterprovinceFeeTableResponse(
                rows, !rows.isEmpty() && rows.stream().allMatch(row -> row.fee() != null));
    }
}
