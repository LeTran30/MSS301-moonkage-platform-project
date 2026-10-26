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

    /** Web page VNPay sends the payer back to; it only shows the result (BR-25). */
    private String returnUrl;

    /** Used when the root that creates a payment gives no deadline (P-01: order and quotation always give one). */
    private Duration defaultLifetime = Duration.ofMinutes(15);

    public boolean isConfigured() {
        return StringUtils.hasText(tmnCode) && StringUtils.hasText(hashSecret) && StringUtils.hasText(returnUrl);
    }
}
