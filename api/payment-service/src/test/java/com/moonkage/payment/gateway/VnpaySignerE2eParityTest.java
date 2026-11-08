package com.moonkage.payment.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Bản chữ ký mà E2E dựa vào.
 *
 * <p>Vì sao cần: {@code web/e2e/vnpay.ts} ký callback VNPay bằng HMAC-SHA512
 * để chạy được luồng thanh toán trên localhost (VNPay không gọi được IPN về
 * máy). Nếu hai bên lệch nhau dù chỉ một byte — khác thứ tự sắp xếp, khác
 * cách URL-encode, khác bộ ký tự an toàn — thì payment-service trả
 * {@code INVALID_SIGNATURE} và mọi luồng thanh toán đỏ với lý do khó đoán.
 *
 * <p>Vì vậy bộ giá trị ở đây phải **giống hệt** bộ giá trị trong
 * {@code web/e2e/__tests__/vnpay-signature.test.ts}. Đổi một bên thì phải
 * đổi cả bên kia.
 */
class VnpaySignerE2eParityTest {

    private static final String SECRET = "e2e-parity-secret";

    /** Bộ giá trị dùng chung với test bên web. */
    private static final Map<String, String> FIELDS = new LinkedHashMap<>();

    static {
        FIELDS.put("vnp_TxnRef", "ABC");
        FIELDS.put("vnp_Amount", "100000");
        FIELDS.put("vnp_CurrCode", "VND");
    }

    @Test
    @DisplayName("chuỗi ký giống hệt bản web: sắp theo tên, bỏ trường rỗng, URL-encode kiểu Java")
    void canonicalQueryMatchesWebImplementation() {
        Map<String, String> fields = new LinkedHashMap<>(FIELDS);
        fields.put("vnp_Empty", "");
        fields.put("vnp_Locale", "vn");

        assertThat(VnpaySigner.canonicalQuery(fields))
                .isEqualTo("vnp_Amount=100000&vnp_CurrCode=VND&vnp_Locale=vn&vnp_TxnRef=ABC");
    }

    @Test
    @DisplayName("giá trị có dấu tiếng Việt được mã hoá giống bản web")
    void canonicalQueryEncodesVietnameseTheSameWay() {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("vnp_Info", "Bánh Trăng Vàng");

        // `URLEncoder.encode(v, US_ASCII)` thay ký tự ngoài ASCII bằng `?` và
        // khoảng trắng bằng `+` — bản web phải cho ra đúng như vậy.
        assertThat(VnpaySigner.canonicalQuery(fields)).isEqualTo("vnp_Info=B%3Fnh+Tr%3Fng+V%3Fng");
    }

    @Test
    @DisplayName("ký tự an toàn của Java được giữ nguyên, `~` thì không")
    void canonicalQueryKeepsJavaSafeCharacters() {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("vnp_Info", "a*b-c.d_e");

        assertThat(VnpaySigner.canonicalQuery(fields)).isEqualTo("vnp_Info=a*b-c.d_e");
    }

    @Test
    @DisplayName("chữ ký là HMAC-SHA512 hex lowercase, 128 ký tự")
    void signatureIsLowercaseHexHmacSha512() {
        String hash = VnpaySigner.sign(FIELDS, SECRET);

        assertThat(hash).hasSize(128).matches("[0-9a-f]+");
    }

    @Test
    @DisplayName("chữ ký không đổi khi thứ tự khai báo đổi")
    void signatureIgnoresDeclarationOrder() {
        Map<String, String> reordered = new LinkedHashMap<>();
        reordered.put("vnp_CurrCode", "VND");
        reordered.put("vnp_Amount", "100000");
        reordered.put("vnp_TxnRef", "ABC");

        assertThat(VnpaySigner.sign(reordered, SECRET)).isEqualTo(VnpaySigner.sign(FIELDS, SECRET));
    }
}
