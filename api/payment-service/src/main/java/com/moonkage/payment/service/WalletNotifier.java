package com.moonkage.payment.service;

import com.moonkage.payment.client.IdentityClient;
import com.moonkage.payment.client.dto.AccountContact;
import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.dto.event.EmailNotificationEvent;
import com.moonkage.payment.dto.event.InAppNotificationEvent;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Tells a buyer their wallet moved: in their inbox always, by email when identity-service answers, so a lookup failure
 * never blocks the money. Both go through the outbox, in the caller's transaction.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WalletNotifier {

    /** The buyer's wallet page on the web (routes.account.wallet). */
    private static final String WALLET_URL = "/tai-khoan/vi";

    private final OutboxService outboxService;
    private final IdentityClient identityClient;

    /**
     * @param heading short line, also the email subject after "Moonkage: "
     * @param message one or two sentences the buyer reads
     */
    public void notify(String accountId, String heading, String message, long amount) {
        String money = money(amount);
        // the web knows ORDER, QUOTE, MAKET, DISPUTE and SYSTEM; wallet money belongs with the orders
        InAppNotificationEvent inApp = new InAppNotificationEvent(
                UUID.randomUUID().toString(), accountId, "ORDER", heading, message, WALLET_URL);
        outboxService.enqueue(inApp.eventId(), RabbitConfig.INAPP_WALLET_ROUTING_KEY, inApp);

        AccountContact contact;
        try {
            contact = identityClient.contact(accountId);
        } catch (RuntimeException e) {
            log.warn("No email for a wallet notice of account {}: {}", accountId, e.getMessage());
            return;
        }
        if (contact == null || contact.email() == null) {
            return;
        }
        EmailNotificationEvent email = new EmailNotificationEvent(
                UUID.randomUUID().toString(),
                contact.email(),
                "Moonkage: " + heading,
                "WALLET_NOTICE",
                Map.of(
                        "userName", contact.fullName() == null ? "Quý khách" : contact.fullName(),
                        "heading", heading,
                        "message", message,
                        "amount", money));
        outboxService.enqueue(email.eventId(), RabbitConfig.EMAIL_WALLET_ROUTING_KEY, email);
    }

    public static String money(long amount) {
        return NumberFormat.getIntegerInstance(Locale.of("vi", "VN")).format(amount) + " ₫";
    }
}
