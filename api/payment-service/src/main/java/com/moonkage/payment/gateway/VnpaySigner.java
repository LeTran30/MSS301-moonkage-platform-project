package com.moonkage.payment.gateway;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * vnp_SecureHash of VNPay 2.1.0: HMAC-SHA512 over the fields sorted by name, empty ones left out, each value
 * URL-encoded as US-ASCII (the merchant sample of VNPay). The same string, plus the hash, is the query of the pay URL.
 */
public final class VnpaySigner {

    public static final String SECURE_HASH = "vnp_SecureHash";
    public static final String SECURE_HASH_TYPE = "vnp_SecureHashType";

    private static final String ALGORITHM = "HmacSHA512";

    private VnpaySigner() {}

    /** The fields as a query string, sorted by name; fields without a value are left out. */
    public static String canonicalQuery(Map<String, String> fields) {
        return new TreeMap<>(fields)
                .entrySet().stream()
                        .filter(e -> e.getValue() != null && !e.getValue().isEmpty())
                        .map(e -> encode(e.getKey()) + "=" + encode(e.getValue()))
                        .collect(Collectors.joining("&"));
    }

    public static String sign(Map<String, String> fields, String secret) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), ALGORITHM));
            byte[] digest = mac.doFinal(canonicalQuery(fields).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HmacSHA512 is not available", e);
        }
    }

    /**
     * Whether a callback from VNPay (IPN or return) carries a hash made with our secret over all its other vnp_
     * fields. Compared in constant time.
     */
    public static boolean verify(Map<String, String> callback, String secret) {
        String received = callback.get(SECURE_HASH);
        if (received == null || received.isEmpty()) {
            return false;
        }
        Map<String, String> signed = new TreeMap<>(callback);
        signed.remove(SECURE_HASH);
        signed.remove(SECURE_HASH_TYPE);
        signed.keySet().removeIf(key -> !key.startsWith("vnp_"));
        byte[] expected = sign(signed, secret).getBytes(StandardCharsets.US_ASCII);
        byte[] actual = received.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, actual);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }
}
