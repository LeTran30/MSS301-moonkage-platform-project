package com.moonkage.payment.gateway;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.junit.jupiter.api.Test;

class VnpaySignerTest {

    private static final String SECRET = "SECRET123";

    /** Expected values computed independently (Python hmac + urllib quote_plus, as the VNPay merchant sample). */
    @Test
    void signsTheSortedEncodedFieldsAndLeavesEmptyOnesOut() {
        Map<String, String> fields = fields();

        assertEquals(
                "vnp_Amount=25000000&vnp_Locale=vn&vnp_OrderInfo=Moonkage+CHECKOUT+abc123"
                        + "&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A5173%2Fthanh-toan%2Fket-qua&vnp_TxnRef=abc123",
                VnpaySigner.canonicalQuery(fields));
        assertEquals(
                "be12fc25c2bb51887f442db3182b73fcef35c79a798d3e582cebdcfdefb89ea319db9ebf358878813d590bbfcc6fc4fe"
                        + "981d0d0d7f42f50e64cdea2d1466a79e",
                VnpaySigner.sign(fields, SECRET));
    }

    @Test
    void acceptsACallbackSignedWithTheSecretWhateverTheHashCase() {
        Map<String, String> callback = fields();
        callback.put(VnpaySigner.SECURE_HASH, VnpaySigner.sign(fields(), SECRET).toUpperCase(Locale.ROOT));
        callback.put(VnpaySigner.SECURE_HASH_TYPE, "HmacSHA512");

        assertTrue(VnpaySigner.verify(callback, SECRET));
    }

    @Test
    void refusesAnAlteredFieldAnotherSecretOrNoHash() {
        Map<String, String> callback = fields();
        callback.put(VnpaySigner.SECURE_HASH, VnpaySigner.sign(fields(), SECRET));

        Map<String, String> altered = new HashMap<>(callback);
        altered.put("vnp_Amount", "100");
        assertFalse(VnpaySigner.verify(altered, SECRET));
        assertFalse(VnpaySigner.verify(callback, "OTHER"));
        assertFalse(VnpaySigner.verify(fields(), SECRET));
    }

    private static Map<String, String> fields() {
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_TxnRef", "abc123");
        fields.put("vnp_Amount", "25000000");
        fields.put("vnp_OrderInfo", "Moonkage CHECKOUT abc123");
        fields.put("vnp_ReturnUrl", "http://localhost:5173/thanh-toan/ket-qua");
        fields.put("vnp_Locale", "vn");
        fields.put("vnp_BankCode", "");
        return fields;
    }
}
