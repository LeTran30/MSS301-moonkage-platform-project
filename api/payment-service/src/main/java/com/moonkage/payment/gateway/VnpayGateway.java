package com.moonkage.payment.gateway;

import com.moonkage.payment.config.VnpayProperties;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Builds the VNPay sandbox pay URL and checks the callbacks VNPay sends back (A-11, BR-25). */
@Component
@RequiredArgsConstructor
public class VnpayGateway {

    public static final String TXN_REF = "vnp_TxnRef";
    public static final String AMOUNT = "vnp_Amount";
    public static final String RESPONSE_CODE = "vnp_ResponseCode";
    public static final String TRANSACTION_STATUS = "vnp_TransactionStatus";
    public static final String TRANSACTION_NO = "vnp_TransactionNo";
    public static final String SUCCESS = "00";

    private static final String VERSION = "2.1.0";
    /** VNPay counts amounts in 1/100 VND. */
    private static final long HUNDREDTHS_PER_VND = 100L;

    private static final DateTimeFormatter VNPAY_TIME =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
    // shortcut: the payer's IP is not passed through order/quotation; send it once those calls carry it
    private static final String PAYER_IP = "127.0.0.1";

    private final VnpayProperties properties;

    /**
     * @param txnRef our unique reference for this payment (vnp_TxnRef)
     * @param amount whole VND; VNPay counts in 1/100 VND
     * @param orderInfo shown to the payer on the VNPay page; ASCII only
     */
    public String payUrl(String txnRef, long amount, String orderInfo, Instant createdAt, Instant expiresAt) {
        if (!properties.isConfigured()) {
            throw new AppException(ErrorCode.GATEWAY_NOT_CONFIGURED);
        }
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("vnp_Version", VERSION);
        fields.put("vnp_Command", "pay");
        fields.put("vnp_TmnCode", properties.getTmnCode());
        fields.put(AMOUNT, String.valueOf(Math.multiplyExact(amount, HUNDREDTHS_PER_VND)));
        fields.put("vnp_CurrCode", "VND");
        fields.put(TXN_REF, txnRef);
        fields.put("vnp_OrderInfo", orderInfo);
        fields.put("vnp_OrderType", "other");
        fields.put("vnp_Locale", "vn");
        fields.put("vnp_ReturnUrl", properties.getReturnUrl());
        fields.put("vnp_IpAddr", PAYER_IP);
        fields.put("vnp_CreateDate", VNPAY_TIME.format(createdAt));
        fields.put("vnp_ExpireDate", VNPAY_TIME.format(expiresAt));
        String hash = VnpaySigner.sign(fields, properties.getHashSecret());
        return properties.getPayUrl() + "?" + VnpaySigner.canonicalQuery(fields) + "&" + VnpaySigner.SECURE_HASH + "="
                + hash;
    }

    /** Whether an IPN or return redirect really comes from VNPay for our merchant. */
    public boolean isAuthentic(Map<String, String> callback) {
        return properties.isConfigured() && VnpaySigner.verify(callback, properties.getHashSecret());
    }

    /** vnp_Amount of a callback, back in whole VND; -1 when missing, not a number or not whole VND. */
    public static long amountOf(Map<String, String> callback) {
        try {
            long hundredths = Long.parseLong(callback.getOrDefault(AMOUNT, ""));
            return hundredths % HUNDREDTHS_PER_VND == 0 ? hundredths / HUNDREDTHS_PER_VND : -1L;
        } catch (NumberFormatException e) {
            return -1L;
        }
    }

    /** VNPay reports a payment as paid only when both codes are 00. */
    public static boolean isPaid(Map<String, String> callback) {
        return SUCCESS.equals(callback.get(RESPONSE_CODE)) && SUCCESS.equals(callback.get(TRANSACTION_STATUS));
    }
}
