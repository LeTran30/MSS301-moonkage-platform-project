package com.moonkage.order.config;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** {@code order.*} in application.yml. */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "order")
public class OrderProperties {

    /** vnp_ExpireDate of a checkout payment (P-01). */
    private Duration paymentLifetime = Duration.ofMinutes(15);

    /** The checkout and its stock hold last this much longer than the payment, so a late IPN still finds them. */
    private Duration checkoutGrace = Duration.ofMinutes(5);

    /** D-13, Q-10 (demo value): buy-now order delivered inside the vendor's areas. */
    private Duration complaintWindowLocal = Duration.ofDays(3);

    /** D-13, Q-10 (demo value): interprovince buy-now and every custom order. */
    private Duration complaintWindowOther = Duration.ofDays(7);
}
