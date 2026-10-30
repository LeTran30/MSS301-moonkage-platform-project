package com.moonkage.identity.address.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Embedded;
import java.util.Objects;

/** Where to deliver: province, ward, then house and street (two administrative levels since 2025-07-01). */
@Embeddable
public record DeliveryLocation(
        @Embedded Province province,

        @Column(name = "ward_name", nullable = false, length = WardName.MAX_LENGTH)
        WardName ward,

        @Column(name = "detail", nullable = false, length = StreetDetail.MAX_LENGTH)
        StreetDetail detail) {

    private static final String ONE_LINE_SEPARATOR = ", ";

    public DeliveryLocation {
        Objects.requireNonNull(province, "province");
        Objects.requireNonNull(ward, "ward");
        Objects.requireNonNull(detail, "detail");
    }

    public DeliveryArea area() {
        return province.area();
    }

    /** "detail, ward, province": the address on one line, as people read it. */
    public String oneLine() {
        return String.join(ONE_LINE_SEPARATOR, detail.value(), ward.value(), province.officialName());
    }
}
