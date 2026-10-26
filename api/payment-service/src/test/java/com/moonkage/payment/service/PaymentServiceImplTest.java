package com.moonkage.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.moonkage.payment.config.RabbitConfig;
import com.moonkage.payment.config.VnpayProperties;
import com.moonkage.payment.dto.event.PaymentFailedEvent;
import com.moonkage.payment.dto.request.CreatePaymentRequest;
import com.moonkage.payment.dto.request.CreatePaymentRequest.AllocationRequest;
import com.moonkage.payment.dto.response.VnpayIpnResponse;
import com.moonkage.payment.entity.Payment;
import com.moonkage.payment.entity.PaymentAllocation;
import com.moonkage.payment.enums.PaymentPurpose;
import com.moonkage.payment.enums.PaymentStatus;
import com.moonkage.payment.enums.RefundReason;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.gateway.VnpayGateway;
import com.moonkage.payment.gateway.VnpaySigner;
import com.moonkage.payment.repository.PaymentAllocationRepository;
import com.moonkage.payment.repository.PaymentRepository;
import com.moonkage.payment.service.impl.PaymentServiceImpl;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

class PaymentServiceImplTest {

    private static final String SECRET = "TEST_SECRET";
    private static final String TXN_REF = "a1b2c3";
    private static final String PAYMENT_ID = "pay-1";
    private static final long AMOUNT = 250_000L;

    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private final PaymentAllocationRepository allocationRepository = mock(PaymentAllocationRepository.class);
    private final LedgerService ledgerService = mock(LedgerService.class);
    private final RefundService refundService = mock(RefundService.class);
    private final OutboxService outboxService = mock(OutboxService.class);

    private PaymentServiceImpl service;
    private Payment payment;

    @BeforeEach
    void setUp() {
        VnpayProperties properties = new VnpayProperties();
        properties.setTmnCode("TMN");
        properties.setHashSecret(SECRET);
        properties.setReturnUrl("http://localhost:5173/thanh-toan/ket-qua");
        service = new PaymentServiceImpl(
                paymentRepository,
                allocationRepository,
                ledgerService,
                refundService,
                outboxService,
                new VnpayGateway(properties),
                properties,
                new TransactionTemplate(mock(PlatformTransactionManager.class)));

        payment = new Payment();
        payment.setId(PAYMENT_ID);
        payment.setPurpose(PaymentPurpose.CHECKOUT);
        payment.setReferenceId("checkout-1");
        payment.setAmount(AMOUNT);
        payment.setGatewayTxnRef(TXN_REF);
        payment.setStatus(PaymentStatus.PENDING);
        when(paymentRepository.findForUpdateByGatewayTxnRef(TXN_REF)).thenReturn(Optional.of(payment));
        when(paymentRepository.saveAndFlush(any(Payment.class))).thenAnswer(call -> call.getArgument(0));
        when(allocationRepository.findByPaymentId(PAYMENT_ID))
                .thenReturn(List.of(
                        new PaymentAllocation(PAYMENT_ID, "order-1", 100_000L),
                        new PaymentAllocation(PAYMENT_ID, "order-2", 150_000L)));
    }

    @Test
    void paidIpnRecordsTheMoneyOnEachOrderAndAnnouncesIt() {
        VnpayIpnResponse answer = service.handleIpn(ipn("00", AMOUNT));

        assertEquals(VnpayIpnResponse.CONFIRMED, answer);
        assertEquals(PaymentStatus.SUCCEEDED, payment.getStatus());
        assertEquals("00", payment.getGatewayResponseCode());
        verify(ledgerService).collect("order-1", 100_000L, PAYMENT_ID);
        verify(ledgerService).collect("order-2", 150_000L, PAYMENT_ID);
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.PAYMENT_SUCCEEDED_ROUTING_KEY), any());
    }

    @Test
    void aRepeatedIpnChangesNothing() {
        payment.setGatewayResponseCode("00");
        payment.setStatus(PaymentStatus.SUCCEEDED);

        assertEquals(VnpayIpnResponse.ALREADY_CONFIRMED, service.handleIpn(ipn("00", AMOUNT)));
        verifyNoInteractions(ledgerService, outboxService);
    }

    @Test
    void anIpnForAnotherAmountIsRefused() {
        assertEquals(VnpayIpnResponse.INVALID_AMOUNT, service.handleIpn(ipn("00", AMOUNT + 1)));
        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        verifyNoInteractions(ledgerService, outboxService);
    }

    @Test
    void anIpnWithABadSignatureIsRefusedBeforeReadingAnything() {
        Map<String, String> forged = ipn("00", AMOUNT);
        forged.put(VnpaySigner.SECURE_HASH, "00ff");

        assertEquals(VnpayIpnResponse.INVALID_SIGNATURE, service.handleIpn(forged));
        verify(paymentRepository, never()).findForUpdateByGatewayTxnRef(anyString());
    }

    @Test
    void aSecondSuccessForTheSameReferenceIsADuplicateAndRefunded() {
        when(paymentRepository.existsByPurposeAndReferenceIdAndStatus(
                        PaymentPurpose.CHECKOUT, "checkout-1", PaymentStatus.SUCCEEDED))
                .thenReturn(true);

        assertEquals(VnpayIpnResponse.CONFIRMED, service.handleIpn(ipn("00", AMOUNT)));
        assertEquals(PaymentStatus.DUPLICATE, payment.getStatus());
        verify(refundService).requestAutomatic(PAYMENT_ID, RefundReason.DUPLICATE_PAYMENT, AMOUNT);
        verifyNoInteractions(ledgerService, outboxService);
    }

    @Test
    void aDeclinedIpnFailsThePaymentAndAnnouncesIt() {
        assertEquals(VnpayIpnResponse.CONFIRMED, service.handleIpn(ipn("24", AMOUNT)));

        assertEquals(PaymentStatus.FAILED, payment.getStatus());
        ArgumentCaptor<Object> event = ArgumentCaptor.forClass(Object.class);
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.PAYMENT_FAILED_ROUTING_KEY), event.capture());
        assertEquals(PaymentFailedEvent.DECLINED, ((PaymentFailedEvent) event.getValue()).reason());
        verifyNoInteractions(ledgerService);
    }

    @Test
    void aSuccessAfterTheDeadlineStillCounts() {
        payment.setStatus(PaymentStatus.FAILED);

        assertEquals(VnpayIpnResponse.CONFIRMED, service.handleIpn(ipn("00", AMOUNT)));
        assertEquals(PaymentStatus.SUCCEEDED, payment.getStatus());
        verify(outboxService).enqueue(anyString(), eq(RabbitConfig.PAYMENT_SUCCEEDED_ROUTING_KEY), any());
    }

    @Test
    void aCheckoutMustSplitItsWholeAmountOverDistinctOrders() {
        AppException wrongTotal = assertThrows(
                AppException.class,
                () -> service.create(checkout(List.of(new AllocationRequest("order-1", 100_000L)))));
        AppException sameOrderTwice = assertThrows(
                AppException.class,
                () -> service.create(checkout(List.of(
                        new AllocationRequest("order-1", 100_000L), new AllocationRequest("order-1", 150_000L)))));

        assertEquals(ErrorCode.ALLOCATIONS_INVALID, wrongTotal.getErrorCode());
        assertEquals(ErrorCode.ALLOCATIONS_INVALID, sameOrderTwice.getErrorCode());
        verify(paymentRepository, never()).saveAndFlush(any());
    }

    @Test
    void aDepositGoesWhollyToTheOrderOfItsAcceptanceAndGetsASignedUrl() {
        when(paymentRepository.saveAndFlush(any(Payment.class))).thenAnswer(call -> {
            Payment saved = call.getArgument(0);
            saved.setId(PAYMENT_ID);
            return saved;
        });
        CreatePaymentRequest deposit = new CreatePaymentRequest(
                PaymentPurpose.DEPOSIT,
                "acceptance-1",
                "buyer-1",
                75_000L,
                Instant.now().plus(10, ChronoUnit.MINUTES),
                null);

        String url = service.create(deposit).paymentUrl();

        ArgumentCaptor<PaymentAllocation> share = ArgumentCaptor.forClass(PaymentAllocation.class);
        verify(allocationRepository).save(share.capture());
        assertEquals("acceptance-1", share.getValue().getOrderId());
        assertEquals(75_000L, share.getValue().getAmount());
        assertTrue(url.contains("vnp_Amount=7500000"));
        assertTrue(url.contains(VnpaySigner.SECURE_HASH + "="));
    }

    @Test
    void anAlreadyPaidReferenceIsNotPaidAgain() {
        when(paymentRepository.existsByPurposeAndReferenceIdAndStatus(
                        eq(PaymentPurpose.CHECKOUT), anyString(), eq(PaymentStatus.SUCCEEDED)))
                .thenReturn(true);

        AppException error = assertThrows(
                AppException.class,
                () -> service.create(checkout(List.of(
                        new AllocationRequest("order-1", 100_000L), new AllocationRequest("order-2", 150_000L)))));
        assertEquals(ErrorCode.PAYMENT_ALREADY_PAID, error.getErrorCode());
        verify(ledgerService, never()).collect(anyString(), anyLong(), anyString());
    }

    private static CreatePaymentRequest checkout(List<AllocationRequest> allocations) {
        return new CreatePaymentRequest(PaymentPurpose.CHECKOUT, "checkout-1", "buyer-1", AMOUNT, null, allocations);
    }

    /** An IPN as VNPay sends it, signed with the test secret. */
    private static Map<String, String> ipn(String responseCode, long amount) {
        Map<String, String> fields = new HashMap<>();
        fields.put("vnp_TmnCode", "TMN");
        fields.put("vnp_TxnRef", TXN_REF);
        fields.put("vnp_Amount", String.valueOf(amount * 100));
        fields.put("vnp_ResponseCode", responseCode);
        fields.put("vnp_TransactionStatus", responseCode);
        fields.put("vnp_TransactionNo", "14000001");
        fields.put("vnp_PayDate", "20261027090000");
        fields.put(VnpaySigner.SECURE_HASH, VnpaySigner.sign(fields, SECRET));
        return fields;
    }
}
