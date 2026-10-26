package com.moonkage.quotation.config;

import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * @param depositPaymentTimeout how long the buyer has on VNPay to pay a deposit; the acceptance expires at the earlier
 *     of this and the quote's validity (L-10 step 4)
 */
@Validated
@ConfigurationProperties("moonkage.quotation")
public record QuotationProperties(@NotNull Duration depositPaymentTimeout) {}
