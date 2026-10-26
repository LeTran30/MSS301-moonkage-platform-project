package com.moonkage.payment.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.moonkage.payment.entity.DisbursementRequest;
import com.moonkage.payment.entity.Ledger;
import com.moonkage.payment.entity.Payment;
import com.moonkage.payment.enums.DisbursementPurpose;
import com.moonkage.payment.enums.DisbursementStatus;
import com.moonkage.payment.enums.PaymentPurpose;
import com.moonkage.payment.enums.PaymentStatus;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Runs the Flyway migrations on a real PostgreSQL and lets Hibernate validate every entity against them
 * ({@code ddl-auto: validate}): an entity that drifts from the schema fails here instead of at container start.
 */
@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=validate")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class PaymentRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String ORDER_ID = "00000000-0000-4000-8000-000000000001";
    private static final String VENDOR_ID = "00000000-0000-4000-8000-000000000002";

    private final EntityManager entityManager;
    private final PaymentRepository paymentRepository;
    private final LedgerRepository ledgerRepository;
    private final DisbursementRequestRepository disbursementRequestRepository;

    @Autowired
    PaymentRepositoryIntegrationTest(
            EntityManager entityManager,
            PaymentRepository paymentRepository,
            LedgerRepository ledgerRepository,
            DisbursementRequestRepository disbursementRequestRepository) {
        this.entityManager = entityManager;
        this.paymentRepository = paymentRepository;
        this.ledgerRepository = ledgerRepository;
        this.disbursementRequestRepository = disbursementRequestRepository;
    }

    @Test
    void registrationFeePaymentRoundTripsWithoutAnOrder() {
        Payment payment = payment(PaymentPurpose.REGISTRATION_FEE, VENDOR_ID, "TXN-1");
        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setGatewayTxnNo("14000001");
        payment.setGatewayResponseCode("00");
        payment.setPaidAt(Instant.parse("2026-10-26T03:00:00Z"));
        String id = paymentRepository.saveAndFlush(payment).getId();
        entityManager.clear();

        Payment found = paymentRepository.findById(id).orElseThrow();
        assertEquals(PaymentPurpose.REGISTRATION_FEE, found.getPurpose());
        assertEquals(VENDOR_ID, found.getReferenceId());
        assertEquals(PaymentStatus.SUCCEEDED, found.getStatus());
        assertNotNull(found.getUpdatedAt());
    }

    @Test
    void secondSuccessForTheSameReferenceIsRejected() {
        Payment first = payment(PaymentPurpose.CHECKOUT, ORDER_ID, "TXN-2");
        first.setStatus(PaymentStatus.SUCCEEDED);
        first.setPaidAt(Instant.parse("2026-10-26T03:00:00Z"));
        paymentRepository.saveAndFlush(first);

        Payment second = payment(PaymentPurpose.CHECKOUT, ORDER_ID, "TXN-3");
        second.setStatus(PaymentStatus.SUCCEEDED);
        second.setPaidAt(Instant.parse("2026-10-26T03:01:00Z"));
        assertThrows(DataIntegrityViolationException.class, () -> paymentRepository.saveAndFlush(second));
    }

    @Test
    void ledgerAndDisbursementRoundTrip() {
        Ledger ledger = new Ledger();
        ledger.setOrderId(ORDER_ID);
        ledger.setVendorId(VENDOR_ID);
        ledgerRepository.saveAndFlush(ledger);

        DisbursementRequest request = new DisbursementRequest();
        request.setOrderId(ORDER_ID);
        request.setVendorId(VENDOR_ID);
        request.setAmount(100_000L);
        request.setPurpose(DisbursementPurpose.MATERIALS);
        String id = disbursementRequestRepository.saveAndFlush(request).getId();
        entityManager.clear();

        assertEquals(VENDOR_ID, ledgerRepository.findAll().get(0).getVendorId());
        DisbursementRequest found = disbursementRequestRepository.findById(id).orElseThrow();
        assertEquals(DisbursementStatus.PENDING, found.getStatus());
        assertNotNull(found.getCreatedAt());
    }

    private static Payment payment(PaymentPurpose purpose, String referenceId, String txnRef) {
        Payment payment = new Payment();
        payment.setPurpose(purpose);
        payment.setReferenceId(referenceId);
        payment.setAmount(200_000L);
        payment.setGatewayTxnRef(txnRef);
        return payment;
    }
}
