package com.moonkage.reference;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Provincial units of Viet Nam with their 2-digit national codes, as listed by Quyết định 19/2025/QĐ-TTg (effective
 * 01/07/2025): 34 units. Every service that stores a {@code province_code} checks it against this list (A-18).
 * catalog-service keeps the same rows in its {@code provinces} table (db/migration/R__provinces.sql); a test keeps
 * the two equal.
 */
public enum Province {
    HA_NOI("01", "Thành phố Hà Nội"),
    CAO_BANG("04", "Tỉnh Cao Bằng"),
    TUYEN_QUANG("08", "Tỉnh Tuyên Quang"),
    DIEN_BIEN("11", "Tỉnh Điện Biên"),
    LAI_CHAU("12", "Tỉnh Lai Châu"),
    SON_LA("14", "Tỉnh Sơn La"),
    LAO_CAI("15", "Tỉnh Lào Cai"),
    THAI_NGUYEN("19", "Tỉnh Thái Nguyên"),
    LANG_SON("20", "Tỉnh Lạng Sơn"),
    QUANG_NINH("22", "Tỉnh Quảng Ninh"),
    BAC_NINH("24", "Tỉnh Bắc Ninh"),
    PHU_THO("25", "Tỉnh Phú Thọ"),
    HAI_PHONG("31", "Thành phố Hải Phòng"),
    HUNG_YEN("33", "Tỉnh Hưng Yên"),
    NINH_BINH("37", "Tỉnh Ninh Bình"),
    THANH_HOA("38", "Tỉnh Thanh Hóa"),
    NGHE_AN("40", "Tỉnh Nghệ An"),
    HA_TINH("42", "Tỉnh Hà Tĩnh"),
    QUANG_TRI("44", "Tỉnh Quảng Trị"),
    HUE("46", "Thành phố Huế"),
    DA_NANG("48", "Thành phố Đà Nẵng"),
    QUANG_NGAI("51", "Tỉnh Quảng Ngãi"),
    GIA_LAI("52", "Tỉnh Gia Lai"),
    KHANH_HOA("56", "Tỉnh Khánh Hòa"),
    DAK_LAK("66", "Tỉnh Đắk Lắk"),
    LAM_DONG("68", "Tỉnh Lâm Đồng"),
    DONG_NAI("75", "Tỉnh Đồng Nai"),
    HO_CHI_MINH("79", "Thành phố Hồ Chí Minh"),
    TAY_NINH("80", "Tỉnh Tây Ninh"),
    DONG_THAP("82", "Tỉnh Đồng Tháp"),
    VINH_LONG("86", "Tỉnh Vĩnh Long"),
    AN_GIANG("91", "Tỉnh An Giang"),
    CAN_THO("92", "Thành phố Cần Thơ"),
    CA_MAU("96", "Tỉnh Cà Mau");

    private static final Map<String, Province> BY_CODE =
            Arrays.stream(values()).collect(Collectors.toUnmodifiableMap(Province::getCode, Function.identity()));

    private final String code;
    private final String officialName;

    Province(String code, String officialName) {
        this.code = code;
        this.officialName = officialName;
    }

    /** The 2-digit national code, e.g. {@code 79}. */
    public String getCode() {
        return code;
    }

    /** The name as written in the decision, e.g. {@code Thành phố Hồ Chí Minh}. */
    public String getOfficialName() {
        return officialName;
    }

    /** The province with this code, or empty when the code is not on the list. */
    public static Optional<Province> fromCode(String code) {
        return Optional.ofNullable(code == null ? null : BY_CODE.get(code));
    }

    /** Whether the code is on the list. */
    public static boolean isKnown(String code) {
        return fromCode(code).isPresent();
    }
}
