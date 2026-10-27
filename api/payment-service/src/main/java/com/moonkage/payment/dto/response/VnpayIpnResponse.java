package com.moonkage.payment.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * The answer VNPay expects from an IPN, always with HTTP 200. VNPay retries until it gets RspCode 00 or 02, so 00 is
 * also the answer to a repeat of an IPN already handled once its result is recorded.
 */
public record VnpayIpnResponse(
        @JsonProperty("RspCode") String rspCode,
        @JsonProperty("Message") String message) {

    public static final VnpayIpnResponse CONFIRMED = new VnpayIpnResponse("00", "Confirm Success");
    public static final VnpayIpnResponse NOT_FOUND = new VnpayIpnResponse("01", "Order not found");
    public static final VnpayIpnResponse ALREADY_CONFIRMED = new VnpayIpnResponse("02", "Order already confirmed");
    public static final VnpayIpnResponse INVALID_AMOUNT = new VnpayIpnResponse("04", "Invalid amount");
    public static final VnpayIpnResponse INVALID_SIGNATURE = new VnpayIpnResponse("97", "Invalid signature");
    public static final VnpayIpnResponse UNKNOWN_ERROR = new VnpayIpnResponse("99", "Unknown error");
}
