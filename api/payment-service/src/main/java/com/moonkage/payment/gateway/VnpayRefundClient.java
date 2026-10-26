package com.moonkage.payment.gateway;

import com.moonkage.payment.config.VnpayProperties;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * VNPay sandbox refund API (merchant_webapi, command "refund", A-11). Any answer other than 00, and any error on the
 * way, is a failed refund: the caller then marks it for manual handling (AC-49.3), never retries on its own.
 */
@Slf4j
@Component
public class VnpayRefundClient {

    private static final String VERSION = "2.1.0";
    private static final String FULL_REFUND = "02";
    private static final String PARTIAL_REFUND = "03";
    private static final long HUNDREDTHS_PER_VND = 100L;
    private static final DateTimeFormatter VNPAY_TIME =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
    // shortcut: the merchant server's own IP is not known inside Docker; VNPay sandbox accepts any
    private static final String SERVER_IP = "127.0.0.1";

    private final VnpayProperties properties;
    private final RestClient restClient;

    public VnpayRefundClient(VnpayProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.restClient = restClientBuilder.build();
    }

    /**
     * @param txnRef vnp_TxnRef of the payment refunded
     * @param transactionNo VNPay's number of that payment; may be null
     * @param paymentCreatedAt the vnp_CreateDate the payment was sent with
     * @param paymentAmount the whole payment; less than it is a partial refund
     * @param createdBy the account asking, or "system"
     */
    public RefundResult refund(
            String txnRef,
            String transactionNo,
            Instant paymentCreatedAt,
            long paymentAmount,
            long amount,
            String createdBy) {
        if (!properties.isConfigured()) {
            return RefundResult.failed("VNPay is not configured");
        }
        Map<String, String> body = new LinkedHashMap<>();
        body.put("vnp_RequestId", UUID.randomUUID().toString().replace("-", ""));
        body.put("vnp_Version", VERSION);
        body.put("vnp_Command", "refund");
        body.put("vnp_TmnCode", properties.getTmnCode());
        body.put("vnp_TransactionType", amount < paymentAmount ? PARTIAL_REFUND : FULL_REFUND);
        body.put("vnp_TxnRef", txnRef);
        body.put("vnp_Amount", String.valueOf(Math.multiplyExact(amount, HUNDREDTHS_PER_VND)));
        body.put("vnp_TransactionNo", transactionNo == null ? "" : transactionNo);
        body.put("vnp_TransactionDate", VNPAY_TIME.format(paymentCreatedAt));
        body.put("vnp_CreateBy", createdBy);
        body.put("vnp_CreateDate", VNPAY_TIME.format(Instant.now()));
        body.put("vnp_IpAddr", SERVER_IP);
        body.put("vnp_OrderInfo", "Moonkage refund " + txnRef);
        body.put("vnp_SecureHash", hash(body));
        try {
            Map<String, Object> answer = restClient
                    .post()
                    .uri(properties.getApiUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
            String code = answer == null ? null : String.valueOf(answer.get("vnp_ResponseCode"));
            if (VnpayGateway.SUCCESS.equals(code)) {
                return RefundResult.succeeded(String.valueOf(answer.get("vnp_TransactionNo")));
            }
            return RefundResult.failed(
                    "VNPay answered " + code + ": " + (answer == null ? "" : answer.get("vnp_Message")));
        } catch (RestClientException e) {
            log.warn("VNPay refund of {} failed: {}", txnRef, e.getMessage());
            return RefundResult.failed("VNPay unreachable: " + e.getMessage());
        }
    }

    /** The refund hash is over these fields, in this order, joined by "|" (VNPay merchant_webapi 2.1.0). */
    private String hash(Map<String, String> body) {
        String data = String.join(
                "|",
                body.get("vnp_RequestId"),
                body.get("vnp_Version"),
                body.get("vnp_Command"),
                body.get("vnp_TmnCode"),
                body.get("vnp_TransactionType"),
                body.get("vnp_TxnRef"),
                body.get("vnp_Amount"),
                body.get("vnp_TransactionNo"),
                body.get("vnp_TransactionDate"),
                body.get("vnp_CreateBy"),
                body.get("vnp_CreateDate"),
                body.get("vnp_IpAddr"),
                body.get("vnp_OrderInfo"));
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(properties.getHashSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HmacSHA512 is not available", e);
        }
    }

    /** @param gatewayRef VNPay's number of the refund when it succeeded */
    public record RefundResult(boolean success, String gatewayRef, String error) {

        static RefundResult succeeded(String gatewayRef) {
            return new RefundResult(true, gatewayRef, null);
        }

        static RefundResult failed(String error) {
            return new RefundResult(false, null, error);
        }
    }
}
