package com.moonkage.payment.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.payment.client.IdentityClient;
import com.moonkage.payment.dto.event.InAppNotificationEvent;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class MoneyNotificationServiceTest {

    private final IdentityClient identityClient = mock(IdentityClient.class);
    private final VendorDirectory vendorDirectory = mock(VendorDirectory.class);
    private final OutboxService outboxService = mock(OutboxService.class);
    private final MoneyNotificationService service =
            new MoneyNotificationService(identityClient, vendorDirectory, outboxService);

    @Test
    void aNewRequestNotifiesEveryAdministratorThroughTheOutbox() {
        when(identityClient.findAdminAccountIds()).thenReturn(List.of("admin-1", "admin-2"));

        service.disbursementRequested("order-1", 500_000L);

        verify(outboxService, times(2))
                .enqueue(anyString(), eq("orchestrator.inapp.payment"), any(InAppNotificationEvent.class));
    }

    @Test
    void aReviewNotifiesTheVendorOwner() {
        when(vendorDirectory.ownerAccountId("vendor-1")).thenReturn(Optional.of("owner-1"));

        service.disbursementReviewed("vendor-1", "order-1", "APPROVED");

        ArgumentCaptor<InAppNotificationEvent> event = ArgumentCaptor.forClass(InAppNotificationEvent.class);
        verify(outboxService).enqueue(anyString(), eq("orchestrator.inapp.payment"), event.capture());
        org.junit.jupiter.api.Assertions.assertEquals(
                "owner-1", event.getValue().recipientAccountId());
        org.junit.jupiter.api.Assertions.assertEquals(
                "DISBURSEMENT_REVIEWED", event.getValue().type());
    }
}
