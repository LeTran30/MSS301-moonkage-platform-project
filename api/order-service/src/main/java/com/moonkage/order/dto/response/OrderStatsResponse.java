package com.moonkage.order.dto.response;

import com.moonkage.order.enums.OrderStatus;
import java.time.LocalDate;
import java.util.List;

/**
 * GET /api/orders/stats: the orders created from {@code from} to {@code to} (both included, days in
 * order.stats-zone). {@code vendorId} null is the whole marketplace; {@code topVendors} is filled only then.
 * {@code daily} has every day of the range, days without orders at 0, so a chart needs no gap filling.
 */
public record OrderStatsResponse(
        LocalDate from,
        LocalDate to,
        String vendorId,
        Totals totals,
        List<DailyPoint> daily,
        List<StatusCount> byStatus,
        List<TopProduct> topProducts,
        List<TopVendor> topVendors) {

    /** {@code averageOrderValue}: revenue / orderCount, rounded down; 0 without orders. */
    public record Totals(long orderCount, long revenue, long buyerCount, long averageOrderValue) {}

    public record DailyPoint(LocalDate date, long orderCount, long revenue) {}

    public record StatusCount(OrderStatus status, long orderCount) {}

    /** {@code revenue}: the product's line subtotals, before shipping. */
    public record TopProduct(String productId, String productName, long quantity, long revenue) {}

    /** {@code vendorName} null when vendor-service could not be asked. */
    public record TopVendor(String vendorId, String vendorName, long orderCount, long revenue) {}
}
