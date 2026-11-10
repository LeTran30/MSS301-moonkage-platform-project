package com.moonkage.payment.config;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/** VNPay sandbox ({@code vnpay.*} in application.yml, values from .env); A-11. */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "vnpay")
public class VnpayProperties {

    /** vnp_TmnCode of the merchant. */
    private String tmnCode;

    /** Secret for the HMAC-SHA512 of every request and callback. */
    private String hashSecret;

    private String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    /** merchant_webapi: refunds (AC-49.3). */
    private String apiUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";

    /**
     * How long a refund call to VNPay may take before it is given up on.
     *
     * <p>Vì sao cần: the refund call runs inside a scheduled sweep. A call with no deadline can hold its
     * thread forever, and with it every other scheduled task that shares the thread — including the outbox
     * relay, so the domain events of the orders stop moving. Bounded, a slow gateway becomes one failed
     * refund waiting for an admin (AC-49.3) instead of a stalled service.
     */
    private Duration refundTimeout = Duration.ofSeconds(10);

    /** Web page VNPay sends the payer back to; it only shows the result (BR-25). */
    private String returnUrl;

    /**
     * Local runs only: VNPay cannot reach an IPN URL on localhost, so the signed return query, forwarded by the web
     * result page, is recorded the way an IPN is. Off everywhere VNPay can call the IPN, which stays the only proof
     * of payment there (BR-25).
     */
    private boolean confirmOnReturn;

    /** Used when the root that creates a payment gives no deadline (P-01: order and quotation always give one). */
    private Duration defaultLifetime = Duration.ofMinutes(15);

    public boolean isConfigured() {
        return StringUtils.hasText(tmnCode) && StringUtils.hasText(hashSecret) && StringUtils.hasText(returnUrl);
    }
}
