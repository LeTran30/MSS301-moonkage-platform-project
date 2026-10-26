package com.moonkage.vendor.common.text;

import java.text.Normalizer;
import java.util.regex.Pattern;

/** Vietnamese text without its diacritics, for comparing names (A-15) and building codes from labels (FR-54). */
public final class Diacritics {

    /** Combining marks left after canonical decomposition: the tone and vowel marks of Vietnamese. */
    private static final Pattern COMBINING_MARKS = Pattern.compile("\\p{M}+");

    private static final char D_STROKE_UPPER = 'Đ';
    private static final char D_STROKE_LOWER = 'đ';

    private Diacritics() {}

    /** "Phạm Văn Đức" → "Pham Van Duc". Đ/đ have no decomposition, so they are mapped to D/d explicitly. */
    public static String strip(String text) {
        String decomposed = Normalizer.normalize(text, Normalizer.Form.NFD);
        return COMBINING_MARKS
                .matcher(decomposed)
                .replaceAll("")
                .replace(D_STROKE_UPPER, 'D')
                .replace(D_STROKE_LOWER, 'd');
    }

    /** True when {@link #strip} would change the text. */
    public static boolean isPresentIn(String text) {
        return !strip(text).equals(Normalizer.normalize(text, Normalizer.Form.NFC));
    }
}
