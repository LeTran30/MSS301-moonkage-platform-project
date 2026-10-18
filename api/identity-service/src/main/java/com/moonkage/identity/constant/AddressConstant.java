package com.moonkage.identity.constant;

/** Delivery address input (FR-03). */
public final class AddressConstant {

    public static final int MAX_DETAIL_LENGTH = 255;

    public static final int MAX_AREA_CODE_LENGTH = 20;

    /** Province / city code (Q-12, demo value), same codes as vendor delivery areas: letters, digits, _ and -. */
    public static final String AREA_CODE_PATTERN = "^[A-Za-z0-9_-]{1," + MAX_AREA_CODE_LENGTH + "}$";

    private AddressConstant() {}
}
