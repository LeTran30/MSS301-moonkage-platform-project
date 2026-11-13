package com.moonkage.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.order.client.facade.VendorDirectory;
import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.request.OpenDisputeRequest;
import com.moonkage.order.dto.request.ResolveDisputeRequest;
import com.moonkage.order.entity.Dispute;
import com.moonkage.order.entity.Order;
import com.moonkage.order.enums.DisputeDecision;
import com.moonkage.order.enums.DisputeReason;
import com.moonkage.order.enums.DisputeStatus;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.DisputeEvidenceRepository;
import com.moonkage.order.repository.DisputeRepository;
import com.moonkage.order.repository.OrderRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.security.Role;
import com.moonkage.order.service.impl.DisputeServiceImpl;
import com.moonkage.order.service.support.OrderAccess;
import com.moonkage.order.storage.OrderFileService;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;

/** BR-18 and P-02: a dispute and a payout of the same order never pass each other. */
class DisputeServiceImplTest {

    private static final String ORDER_ID = "order-1";
    private static final CurrentUserInfo BUYER = new CurrentUserInfo("buyer-1", Role.MEMBER);
    private static final CurrentUserInfo ADMIN = new CurrentUserInfo("admin-1", Role.ADMIN);

    private final DisputeRepository disputeRepository = mock(DisputeRepository.class);
    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final VendorDirectory vendorDirectory = mock(VendorDirectory.class);
    private final OutboxService outboxService = mock(OutboxService.class);

    private DisputeServiceImpl service;
    private Order order;

    @BeforeEach
    void setUp() {
        service = new DisputeServiceImpl(
                disputeRepository,
                mock(DisputeEvidenceRepository.class),
                orderRepository,
                new OrderAccess(orderRepository, vendorDirectory),
                mock(OrderFileService.class),
                outboxService);
        order = new Order();
        order.setId(ORDER_ID);
        order.setKind(OrderKind.BUY_NOW);
        order.setStatus(OrderStatus.DELIVERED);
        order.setBuyerAccountId(BUYER.accountId());
        order.setVendorId("vendor-1");
        order.setTotalAmount(230_000L);
        order.setDeliveredAt(Instant.now().minus(Duration.ofDays(1)));
        order.setComplaintDeadline(Instant.now().plus(Duration.ofDays(2)));
        when(orderRepository.findForUpdateById(ORDER_ID)).thenReturn(Optional.of(order));
        when(vendorDirectory.ownedVendorId(anyString())).thenReturn(Optional.empty());
        when(disputeRepository.saveAndFlush(any(Dispute.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void theBuyerOpensADisputeWithinTheWindowAndPaymentIsTold() {
        service.open(BUYER, ORDER_ID, damaged());

        verify(disputeRepository).saveAndFlush(any(Dispute.class));
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.DISPUTE_OPENED_ROUTING_KEY), any());
    }

    @Test
    void noDisputeAfterTheComplaintDeadline() {
        order.setComplaintDeadline(Instant.now().minusSeconds(1));

        AppException error = assertThrows(AppException.class, () -> service.open(BUYER, ORDER_ID, damaged()));

        assertEquals(ErrorCode.COMPLAINT_WINDOW_CLOSED, error.getErrorCode());
    }

    @Test
    void noDisputeOnceThePayoutIsLocked() {
        order.setPayoutLockedAt(Instant.now());

        AppException error = assertThrows(AppException.class, () -> service.open(BUYER, ORDER_ID, damaged()));

        assertEquals(ErrorCode.PAYOUT_LOCKED, error.getErrorCode());
        verify(disputeRepository, never()).saveAndFlush(any());
    }

    @Test
    void anOrderStillInItsWindowCannotBeLockedForPayout() {
        AppException error = assertThrows(AppException.class, () -> service.lockForPayout(ORDER_ID));

        assertEquals(ErrorCode.PAYOUT_NOT_ELIGIBLE, error.getErrorCode());
    }

    @Test
    void anOrderWithAnOpenDisputeCannotBeLockedForPayout() {
        order.setReceivedConfirmedAt(Instant.now());
        when(disputeRepository.existsByOrderIdAndStatus(ORDER_ID, DisputeStatus.OPEN))
                .thenReturn(true);

        AppException error = assertThrows(AppException.class, () -> service.lockForPayout(ORDER_ID));

        assertEquals(ErrorCode.PAYOUT_NOT_ELIGIBLE, error.getErrorCode());
    }

    @Test
    void aReceivedOrderIsLockedOnceAndTheLockIsAnsweredAgain() {
        order.setReceivedConfirmedAt(Instant.now());

        Instant locked = service.lockForPayout(ORDER_ID).payoutLockedAt();

        assertNotNull(locked);
        assertEquals(locked, service.lockForPayout(ORDER_ID).payoutLockedAt());
    }

    @Test
    void aFullRefundDecisionGivesBackTheOrderTotal() {
        Dispute open = new Dispute();
        open.setOrder(order);
        open.setReason(DisputeReason.DAMAGED);
        open.setDescription("Bánh bị vỡ");
        open.setStatus(DisputeStatus.OPEN);
        when(disputeRepository.findFirstByOrderIdOrderByCreatedAtDesc(ORDER_ID)).thenReturn(Optional.of(open));

        service.resolve(ADMIN, ORDER_ID, new ResolveDisputeRequest(DisputeDecision.FULL_REFUND, null, "Ảnh rõ ràng"));

        assertEquals(DisputeStatus.RESOLVED, open.getStatus());
        assertEquals(230_000L, open.getRefundAmount());
        assertEquals(ADMIN.accountId(), open.getDecidedBy());
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.DISPUTE_RESOLVED_ROUTING_KEY), any());
    }

    private static OpenDisputeRequest damaged() {
        return new OpenDisputeRequest(DisputeReason.DAMAGED, "Hộp bánh bị móp, bánh vỡ", List.of());
    }
    // ----- FR-49, Q5.0: the admin's queue -----

    @Test
    void onlyAnAdminReadsTheDisputeQueue() {
        AppException refused = assertThrows(AppException.class, () -> service.list(BUYER, DisputeStatus.OPEN, 0, 20));

        assertEquals(ErrorCode.ACCESS_DENIED, refused.getErrorCode());
    }

    @Test
    void theDecidedDisputesComeLatestFirstWithTheirOrder() {
        order.setVendorName("Bánh Dẻo Chợ Lớn");
        order.setRecipientName("Phan Quốc Bảo");
        Dispute decided = new Dispute();
        decided.setId("dispute-1");
        decided.setOrder(order);
        decided.setReason(DisputeReason.DAMAGED);
        decided.setDescription("Hộp móp");
        decided.setStatus(DisputeStatus.RESOLVED);
        when(disputeRepository.findByStatusOrderByResolvedAtDesc(eq(DisputeStatus.RESOLVED), any()))
                .thenReturn(new PageImpl<>(List.of(decided)));

        var page = service.list(ADMIN, DisputeStatus.RESOLVED, 0, 20);

        assertEquals(1, page.content().size());
        var row = page.content().get(0);
        assertEquals(ORDER_ID, row.orderId());
        assertEquals("Bánh Dẻo Chợ Lớn", row.vendorName());
        assertEquals("Phan Quốc Bảo", row.recipientName());
        assertEquals(230_000L, row.orderTotalAmount());
    }
}
