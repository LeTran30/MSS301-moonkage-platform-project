package com.moonkage.storage;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Leading bytes ("magic numbers") of each content type the platform stores. A file whose first bytes do not match its
 * declared type is rejected, so an HTML page uploaded as image/png is never served.
 */
public final class FileSignatures {

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
    private static final byte[] RIFF = "RIFF".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] WEBP = "WEBP".getBytes(StandardCharsets.US_ASCII);
    /** WEBP follows RIFF and the 4-byte RIFF size. */
    private static final int WEBP_OFFSET = 8;

    private static final byte[] PDF = "%PDF-".getBytes(StandardCharsets.US_ASCII);

    private FileSignatures() {}

    public static boolean hasSignature(String contentType, byte[] content) {
        return switch (contentType) {
            case "image/jpeg" -> startsWith(content, 0, JPEG);
            case "image/png" -> startsWith(content, 0, PNG);
            case "image/webp" -> startsWith(content, 0, RIFF) && startsWith(content, WEBP_OFFSET, WEBP);
            case "application/pdf" -> startsWith(content, 0, PDF);
            default -> false;
        };
    }

    private static boolean startsWith(byte[] content, int offset, byte[] expected) {
        return content.length >= offset + expected.length
                && Arrays.equals(content, offset, offset + expected.length, expected, 0, expected.length);
    }
}
