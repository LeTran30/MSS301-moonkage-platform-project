package com.moonkage.observability;

/**
 * Masks the personal data before it goes into a log line (NFR-03, RT-03).
 *
 * <p>The log is kept for the operator; the person it names is not the operator's business. So an e-mail address
 * becomes {@code l***n@example.com} and a phone number {@code 091****678}: enough to tell two callers apart, not
 * enough to identify one.
 */
public final class PiiMasker {

    /** The digits kept at the start of a masked phone number. */
    private static final int PHONE_PREFIX_LENGTH = 3;

    /** The digits kept at the end of a masked phone number. */
    private static final int PHONE_SUFFIX_LENGTH = 3;

    /** The stars that replace the hidden digits of a phone number. */
    private static final String PHONE_FILLER = "****";

    /** What a value too short to mask is replaced with. */
    private static final String FULLY_MASKED = "***";

    /** The stars that replace the hidden part of the local part of an e-mail address. */
    private static final String EMAIL_FILLER = "***";

    private PiiMasker() {
        throw new AssertionError("no instances");
    }

    /**
     * The masked form of an e-mail address: the first character of the local part, the last character before the
     * {@code @}, and the whole domain. A value without an {@code @} or too short to mask is hidden completely.
     */
    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "";
        }
        int at = email.indexOf('@');
        if (at <= 1 || at == email.length() - 1) {
            return FULLY_MASKED;
        }
        return email.charAt(0) + EMAIL_FILLER + email.charAt(at - 1) + email.substring(at);
    }

    /**
     * The masked form of a phone number: the first three and the last three digits, the rest replaced by stars.
     * A value that is not a number long enough is hidden completely.
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return "";
        }
        String digits = phone.replaceAll("\\D", "");
        int minLength = PHONE_PREFIX_LENGTH + PHONE_SUFFIX_LENGTH + 1;
        if (digits.length() < minLength) {
            return FULLY_MASKED;
        }
        return digits.substring(0, PHONE_PREFIX_LENGTH)
                + PHONE_FILLER
                + digits.substring(digits.length() - PHONE_SUFFIX_LENGTH);
    }
}
