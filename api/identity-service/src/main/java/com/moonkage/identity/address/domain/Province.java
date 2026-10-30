package com.moonkage.identity.address.domain;

import com.moonkage.identity.shared.value.Text;
import com.moonkage.identity.shared.value.ValueRejected;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * A province or city of the national list, with the official name it had when the address was saved, so the address
 * reads the same after a later rename. The name never comes from the client (decision C3).
 */
@Embeddable
public record Province(
        @Column(name = "province_code", nullable = false, length = Province.CODE_DIGITS)
        String code,

        @Column(name = "province_name", nullable = false, length = Province.MAX_NAME_LENGTH)
        String officialName) {

    public static final int CODE_DIGITS = 2;
    public static final int MAX_NAME_LENGTH = 100;

    public Province {
        Text.assertPresent(code, "province code");
        Text.assertPresent(officialName, "province name");
    }

    /** The 2-digit national code, e.g. 79; REQUIRED when blank, UNKNOWN_CODE when not on the national list. */
    public static Province parse(String rawCode) {
        // the national list has the same simple name as this value
        return com.moonkage.reference.Province.fromCode(Text.required(rawCode))
                .map(official -> new Province(official.getCode(), official.getOfficialName()))
                .orElseThrow(ValueRejected::unknownCode);
    }

    public DeliveryArea area() {
        return new DeliveryArea(code);
    }
}
