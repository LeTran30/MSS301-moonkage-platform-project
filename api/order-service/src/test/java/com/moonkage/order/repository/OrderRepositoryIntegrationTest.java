package com.moonkage.order.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.moonkage.order.entity.CartItem;
import com.moonkage.order.entity.Dispute;
import com.moonkage.order.entity.DisputeEvidence;
import com.moonkage.order.entity.InvoiceInfo;
import com.moonkage.order.entity.MockupVersion;
import com.moonkage.order.entity.Order;
import com.moonkage.order.entity.OrderItem;
import com.moonkage.order.entity.ProgressUpdate;
import com.moonkage.order.entity.Review;
import com.moonkage.order.entity.Voucher;
import com.moonkage.order.enums.DisputeParty;
import com.moonkage.order.enums.DisputeReason;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
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
class OrderRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String BUYER_ID = "00000000-0000-4000-8000-000000000001";
    private static final String VENDOR_ID = "00000000-0000-4000-8000-000000000002";
    private static final String PRODUCT_ID = "00000000-0000-4000-8000-000000000003";
    private static final Instant NOW = Instant.parse("2026-10-26T03:00:00Z");

    private final EntityManager entityManager;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final MockupVersionRepository mockupVersionRepository;
    private final ProgressUpdateRepository progressUpdateRepository;
    private final DisputeRepository disputeRepository;
    private final DisputeEvidenceRepository disputeEvidenceRepository;
    private final ReviewRepository reviewRepository;
    private final VoucherRepository voucherRepository;

    @Autowired
    OrderRepositoryIntegrationTest(
            EntityManager entityManager,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartItemRepository cartItemRepository,
            MockupVersionRepository mockupVersionRepository,
            ProgressUpdateRepository progressUpdateRepository,
            DisputeRepository disputeRepository,
            DisputeEvidenceRepository disputeEvidenceRepository,
            ReviewRepository reviewRepository,
            VoucherRepository voucherRepository) {
        this.entityManager = entityManager;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.mockupVersionRepository = mockupVersionRepository;
        this.progressUpdateRepository = progressUpdateRepository;
        this.disputeRepository = disputeRepository;
        this.disputeEvidenceRepository = disputeEvidenceRepository;
        this.reviewRepository = reviewRepository;
        this.voucherRepository = voucherRepository;
    }

    @Test
    void buyNowOrderWithItemsReviewAndDisputeRoundTrips() {
        Order order = order(OrderKind.BUY_NOW, OrderStatus.DELIVERED);
        order.setPaymentGroupId("00000000-0000-4000-8000-000000000010");
        order.setRecipientName("Nguyễn Văn A");
        order.setRecipientPhone("0901234567");
        order.setComplaintDeadline(NOW);
        InvoiceInfo invoice = new InvoiceInfo();
        invoice.setInvoiceName("Công ty A");
        invoice.setInvoiceTaxCode("0312345678");
        invoice.setInvoiceAddress("1 Lê Lợi");
        invoice.setInvoiceEmail("ketoan@a.vn");
        order.setInvoiceInfo(invoice);
        orderRepository.saveAndFlush(order);

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProductId(PRODUCT_ID);
        item.setProductName("Hộp 4 bánh nướng");
        item.setQuantity(2);
        item.setUnitPrice(150_000L);
        item.setSubtotal(300_000L);
        orderItemRepository.saveAndFlush(item);

        Review review = new Review();
        review.setOrderId(order.getId());
        review.setProductId(PRODUCT_ID);
        review.setVendorId(VENDOR_ID);
        review.setBuyerAccountId(BUYER_ID);
        review.setRating(5);
        reviewRepository.saveAndFlush(review);

        Dispute dispute = new Dispute();
        dispute.setOrder(order);
        dispute.setBuyerAccountId(BUYER_ID);
        dispute.setReason(DisputeReason.DAMAGED);
        dispute.setDescription("Hộp móp");
        disputeRepository.saveAndFlush(dispute);
        DisputeEvidence evidence = new DisputeEvidence();
        evidence.setDispute(dispute);
        evidence.setParty(DisputeParty.BUYER);
        evidence.setObjectKey("order/disputes/photo.jpg");
        disputeEvidenceRepository.saveAndFlush(evidence);
        entityManager.clear();

        Order found = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(BUYER_ID, found.getBuyerAccountId());
        assertEquals("Công ty A", found.getInvoiceInfo().getInvoiceName());
        assertEquals("79", found.getDeliveryProvinceCode());
        assertEquals(1, disputeEvidenceRepository.count());
    }

    @Test
    void customOrderWithAgreementMockupAndProgressRoundTrips() {
        Order order = order(OrderKind.CUSTOM_ORDER, OrderStatus.IN_PRODUCTION);
        order.setQuoteId("00000000-0000-4000-8000-000000000020");
        order.setAgreementId("00000000-0000-4000-8000-000000000021");
        order.setAgreementHash("a".repeat(64));
        order.setDepositAmount(90_000L);
        order.setRemainingAmount(210_000L);
        order.setHasCustom(true);
        order.setDeliveryDate(LocalDate.of(2026, 11, 20));
        order.setDeliveryMethod("Giao tận nơi");
        orderRepository.saveAndFlush(order);

        MockupVersion mockup = new MockupVersion();
        mockup.setOrder(order);
        mockup.setVersionNo(1);
        mockup.setObjectKey("order/mockups/v1.png");
        mockupVersionRepository.saveAndFlush(mockup);

        ProgressUpdate progress = new ProgressUpdate();
        progress.setOrder(order);
        progress.setMilestone(OrderStatus.IN_PRODUCTION);
        progress.setPhotoKeys(List.of("order/progress/1.jpg"));
        progressUpdateRepository.saveAndFlush(progress);
        entityManager.clear();

        Order found = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals("a".repeat(64), found.getAgreementHash());
        assertEquals(
                List.of("order/progress/1.jpg"),
                progressUpdateRepository.findAll().get(0).getPhotoKeys());
        assertEquals(
                "order/mockups/v1.png", mockupVersionRepository.findAll().get(0).getObjectKey());
    }

    @Test
    void cartItemAndVoucherRoundTrip() {
        CartItem cartItem = new CartItem();
        cartItem.setBuyerAccountId(BUYER_ID);
        cartItem.setProductId(PRODUCT_ID);
        cartItem.setVendorId(VENDOR_ID);
        cartItem.setQuantity(3);
        cartItemRepository.saveAndFlush(cartItem);

        Voucher voucher = new Voucher();
        voucher.setCode("TRUNGTHU");
        voucher.setDiscountAmount(20_000L);
        voucher.setValidFrom(NOW);
        voucher.setValidTo(NOW.plusSeconds(86_400));
        voucher.setMaxUses(100);
        voucherRepository.saveAndFlush(voucher);
        entityManager.clear();

        assertEquals(BUYER_ID, cartItemRepository.findAll().get(0).getBuyerAccountId());
        assertNotNull(voucherRepository.findAll().get(0).getVersion());
    }

    private static Order order(OrderKind kind, OrderStatus status) {
        Order order = new Order();
        order.setBuyerAccountId(BUYER_ID);
        order.setVendorId(VENDOR_ID);
        order.setKind(kind);
        order.setStatus(status);
        order.setItemsAmount(300_000L);
        order.setTotalAmount(300_000L);
        order.setDeliveryAddressDetail("1 Lê Lợi, Quận 1");
        order.setDeliveryProvinceCode("79");
        return order;
    }
}
