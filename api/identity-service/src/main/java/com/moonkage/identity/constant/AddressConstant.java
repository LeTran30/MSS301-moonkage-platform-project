package com.moonkage.identity.constant;

/**
 * Delivery address input (FR-03). Vietnam has two administrative levels since 2025-07-01: province / city, then
 * ward / commune / special zone (no district). The province uses a 2-digit national code; the ward name is display
 * text (L-15).
 */
public final class AddressConstant {

    public static final int MAX_RECIPIENT_NAME_LENGTH = 100;

    public static final int PROVINCE_CODE_DIGITS = 2;

    public static final String PROVINCE_CODE_PATTERN = "^\\d{" + PROVINCE_CODE_DIGITS + "}$";

    /** Name of a province or ward, kept with its code so the address reads the same after a later rename. */
    public static final int MAX_ADMINISTRATIVE_UNIT_NAME_LENGTH = 100;

    public static final int MAX_DETAIL_LENGTH = 255;

    /** Short user tag such as "Nhà riêng" or "Văn phòng". */
    public static final int MAX_LABEL_LENGTH = 30;

    /** Joins detail, ward and province into the one-line address shown to people. */
    public static final String FULL_ADDRESS_SEPARATOR = ", ";

    private AddressConstant() {}
}
