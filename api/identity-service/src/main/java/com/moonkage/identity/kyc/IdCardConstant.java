package com.moonkage.identity.kyc;

/**
 * Format of the simulated ID card (Requirement A-08) and how its number is shown (AC-04.12). Shared by the card
 * check, the internal ID number check (BR-27) and the legal_profiles columns, so they cannot drift apart.
 */
final class IdCardConstant {

    /** CCCD numbers are exactly 12 digits. */
    public static final int ID_NUMBER_DIGITS = 12;

    public static final String ID_NUMBER_PATTERN = "\\d{" + ID_NUMBER_DIGITS + "}";

    /** Anything that is not a digit; stripped from a declared number ("079 123-456 789"). */
    public static final String NON_DIGIT_PATTERN = "\\D";

    /** Upper case, no diacritics, words separated by one space. */
    public static final String LEGAL_NAME_PATTERN = "[A-Z]+( [A-Z]+)*";

    /** Card dates are yyyy-MM-dd; "uuuu" so a strict parser rejects 2023-02-30. */
    public static final String DATE_PATTERN = "uuuu-MM-dd";

    public static final int MAX_LEGAL_NAME_LENGTH = 100;
    public static final int MAX_NATIONALITY_LENGTH = 50;
    public static final int MAX_PLACE_LENGTH = 255;

    /** Masked form keeps the last 4 digits: ********1234. */
    public static final int MASK_VISIBLE_DIGITS = 4;

    public static final String MASK_CHAR = "*";

    private IdCardConstant() {}
}
