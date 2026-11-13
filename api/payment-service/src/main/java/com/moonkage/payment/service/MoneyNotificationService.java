package com.moonkage.payment.service;

import com.moonkage.payment.client.IdentityClient;
import com.moonkage.payment.dto.event.InAppNotificationEvent;
import feign.FeignException;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/** Transactional outbox notifications for the human steps of the money workflow. */
@Slf4j
@Service
@RequiredArgsConstructor
public class MoneyNotificationService {

    private static final String ROUTING_KEY = "orchestrator.inapp.payment";

    private final IdentityClient identityClient;
    private final VendorDirectory vendorDirectory;
    private final OutboxService outboxService;

    public void disbursementRequested(String orderId, long amount) {
        List<String> adminIds;
        try {
            adminIds = identityClient.findAdminAccountIds();
        } catch (FeignException e) {
            log.warn("Could not resolve administrators for disbursement notification: {}", e.status());
            return;
        }
        adminIds.forEach(accountId -> enqueue(
                accountId,
                "DISBURSEMENT_REQUESTED",
                "Có yêu cầu giải ngân mới",
                "Đơn " + orderId + " yêu cầu giải ngân " + amount + " VND.",
                "/admin/disbursements"));
    }

    public void disbursementReviewed(String vendorId, String orderId, String status) {
        notifyVendor(
                vendorId,
                "DISBURSEMENT_REVIEWED",
                "Yêu cầu giải ngân đã được xử lý",
                "Yêu cầu của đơn " + orderId + " đã được " + status.toLowerCase(Locale.ROOT) + ".",
                "/vendor/disbursements");
    }

    public void payoutCompleted(String vendorId, String orderId, long amount) {
        notifyVendor(
                vendorId,
                "PAYOUT_COMPLETED",
                "Đơn hàng đã được payout",
                "Đơn " + orderId + " đã payout " + amount + " VND.",
                "/vendor/money");
    }

    private void notifyVendor(String vendorId, String type, String title, String content, String targetUrl) {
        try {
            vendorDirectory
                    .ownerAccountId(vendorId)
                    .ifPresent(accountId -> enqueue(accountId, type, title, content, targetUrl));
        } catch (FeignException e) {
            log.warn("Could not resolve vendor owner for notification: vendor={}, status={}", vendorId, e.status());
        }
    }

    private void enqueue(String recipient, String type, String title, String content, String targetUrl) {
        String eventId = UUID.randomUUID().toString();
        outboxService.enqueue(
                eventId, ROUTING_KEY, new InAppNotificationEvent(eventId, recipient, type, title, content, targetUrl));
    }
}
