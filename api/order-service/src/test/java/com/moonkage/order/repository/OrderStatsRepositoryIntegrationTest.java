package com.moonkage.order.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.moonkage.order.entity.Order;
import com.moonkage.order.entity.OrderItem;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import com.moonkage.order.repository.OrderStatsRepository.DailyRow;
import com.moonkage.order.repository.OrderStatsRepository.ProductRow;
import com.moonkage.order.repository.OrderStatsRepository.StatusRow;
import com.moonkage.order.repository.OrderStatsRepository.TotalsRow;
import com.moonkage.order.repository.OrderStatsRepository.VendorRow;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** The report sums on a real PostgreSQL: range edges, the day cut in the report's zone, the vendor filter. */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("it")
@Testcontainers(disabledWithoutDocker = true)
class OrderStatsRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String VENDOR_A = "00000000-0000-4000-8000-0000000000a1";
    private static final String VENDOR_B = "00000000-0000-4000-8000-0000000000b1";
    private static final String BUYER_1 = "00000000-0000-4000-8000-000000000001";
    private static final String BUYER_2 = "00000000-0000-4000-8000-000000000002";
    private static final LocalDate DAY_1 = LocalDate.of(2026, 11, 1);
    private static final LocalDate DAY_2 = LocalDate.of(2026, 11, 2);
    private static final Instant START = DAY_1.atStartOfDay(ZONE).toInstant();
    private static final Instant END = DAY_2.plusDays(1).atStartOfDay(ZONE).toInstant();

    private final EntityManager entityManager;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatsRepository statsRepository;

    @Autowired
    OrderStatsRepositoryIntegrationTest(
            EntityManager entityManager,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderStatsRepository statsRepository) {
        this.entityManager = entityManager;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.statsRepository = statsRepository;
    }

    @BeforeEach
    void seed() {
        // 2026-11-01 23:30 in Vietnam is still 16:30 UTC of the same day; 2026-11-02 00:30 is 17:30 UTC of the 1st,
        // so a day cut in UTC would put both on the 1st
        order(VENDOR_A, BUYER_1, OrderStatus.COMPLETED, 300_000, "2026-11-01T23:30:00+07:00", "p1", 2, 270_000);
        order(VENDOR_A, BUYER_2, OrderStatus.PAID, 200_000, "2026-11-02T00:30:00+07:00", "p2", 1, 170_000);
        order(VENDOR_B, BUYER_1, OrderStatus.COMPLETED, 500_000, "2026-11-02T10:00:00+07:00", "p3", 1, 470_000);
        // outside the range on both sides
        order(VENDOR_A, BUYER_2, OrderStatus.COMPLETED, 900_000, "2026-10-31T23:59:00+07:00", "p1", 1, 870_000);
        order(VENDOR_A, BUYER_2, OrderStatus.COMPLETED, 900_000, "2026-11-03T00:00:00+07:00", "p1", 1, 870_000);
        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void totalsCountOnlyTheRange() {
        TotalsRow all = statsRepository.totals(START, END, null);
        assertEquals(3, all.getOrderCount());
        assertEquals(1_000_000, all.getRevenue());
        assertEquals(2, all.getBuyerCount());

        TotalsRow vendorA = statsRepository.totals(START, END, VENDOR_A);
        assertEquals(2, vendorA.getOrderCount());
        assertEquals(500_000, vendorA.getRevenue());
    }

    @Test
    void dailyCutsTheDayInTheReportZone() {
        List<DailyRow> daily = statsRepository.daily(START, END, null, ZONE.getId());
        assertEquals(2, daily.size());
        assertEquals(DAY_1, daily.get(0).getDay());
        assertEquals(1, daily.get(0).getOrderCount());
        assertEquals(300_000, daily.get(0).getRevenue());
        assertEquals(DAY_2, daily.get(1).getDay());
        assertEquals(2, daily.get(1).getOrderCount());
        assertEquals(700_000, daily.get(1).getRevenue());
    }

    @Test
    void byStatusAndTopListsRankByMoney() {
        List<StatusRow> statuses = statsRepository.byStatus(START, END, null);
        assertEquals("COMPLETED", statuses.get(0).getStatus());
        assertEquals(2, statuses.get(0).getOrderCount());

        List<ProductRow> products = statsRepository.topProducts(START, END, null, 2);
        assertEquals(
                List.of("p3", "p1"),
                products.stream().map(ProductRow::getProductId).toList());
        assertEquals(2, products.get(1).getQuantity());
        assertEquals(270_000, products.get(1).getRevenue());

        List<VendorRow> vendors = statsRepository.topVendors(START, END, 5);
        // both brought 500.000đ: the tie is broken by the vendor ID, so the order is stable
        assertEquals(
                List.of(VENDOR_A, VENDOR_B),
                vendors.stream().map(VendorRow::getVendorId).toList());
        assertEquals(2, vendors.get(0).getOrderCount());
    }

    private void order(
            String vendorId,
            String buyerId,
            OrderStatus status,
            long total,
            String createdAt,
            String productId,
            int quantity,
            long subtotal) {
        Order order = new Order();
        order.setBuyerAccountId(buyerId);
        order.setVendorId(vendorId);
        order.setKind(OrderKind.BUY_NOW);
        order.setStatus(status);
        order.setPaymentGroupId("00000000-0000-4000-8000-000000000010");
        order.setItemsAmount(subtotal);
        order.setShippingFee(total - subtotal);
        order.setTotalAmount(total);
        order.setDeliveryAddressDetail("1 Lê Lợi, Quận 1");
        order.setDeliveryProvinceCode("79");
        orderRepository.saveAndFlush(order);

        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProductId(productId);
        item.setProductName("Sản phẩm " + productId);
        item.setQuantity(quantity);
        item.setUnitPrice(subtotal / quantity);
        item.setSubtotal(subtotal);
        orderItemRepository.saveAndFlush(item);

        // created_at is set by Hibernate on insert; the report needs a chosen moment
        entityManager
                .createNativeQuery("update orders set created_at = cast(:at as timestamptz) where id = :id")
                .setParameter("at", createdAt)
                .setParameter("id", order.getId())
                .executeUpdate();
    }
}
