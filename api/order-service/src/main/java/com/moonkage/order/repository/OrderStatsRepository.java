package com.moonkage.order.repository;

import com.moonkage.order.entity.Order;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

/**
 * The sums behind GET /api/orders/stats. An order counts on the day it was created, which is the moment its payment
 * succeeded (a buy-now order) or its deposit was paid (a custom order): there is no order before the money. Amounts
 * are what the buyer paid ({@code total_amount}); refunds live in payment-service and are not taken off here.
 * {@code vendorId} null means the whole marketplace. {@code start} is inclusive and {@code end} exclusive.
 */
public interface OrderStatsRepository extends Repository<Order, String> {

    /** Orders, money and distinct buyers of the range. */
    @Query(value = """
                    select count(*) as orderCount,
                           cast(coalesce(sum(o.total_amount), 0) as bigint) as revenue,
                           count(distinct o.buyer_account_id) as buyerCount
                    from orders o
                    where o.created_at >= :start and o.created_at < :end
                      and (cast(:vendorId as varchar) is null or o.vendor_id = :vendorId)
                    """, nativeQuery = true)
    TotalsRow totals(Instant start, Instant end, String vendorId);

    /** One row per day that has orders, the day cut in {@code zone}; days without orders are missing. */
    @Query(value = """
                    select cast(o.created_at at time zone :zone as date) as day,
                           count(*) as orderCount,
                           cast(sum(o.total_amount) as bigint) as revenue
                    from orders o
                    where o.created_at >= :start and o.created_at < :end
                      and (cast(:vendorId as varchar) is null or o.vendor_id = :vendorId)
                    group by 1
                    order by 1
                    """, nativeQuery = true)
    List<DailyRow> daily(Instant start, Instant end, String vendorId, String zone);

    /** Orders of the range by their status now. */
    @Query(value = """
                    select o.status as status, count(*) as orderCount
                    from orders o
                    where o.created_at >= :start and o.created_at < :end
                      and (cast(:vendorId as varchar) is null or o.vendor_id = :vendorId)
                    group by o.status
                    order by orderCount desc, o.status
                    """, nativeQuery = true)
    List<StatusRow> byStatus(Instant start, Instant end, String vendorId);

    /** The products that brought the most money (their line subtotals, before shipping). */
    @Query(value = """
                    select i.product_id as productId,
                           max(i.product_name) as productName,
                           cast(sum(i.quantity) as bigint) as quantity,
                           cast(sum(i.subtotal) as bigint) as revenue
                    from order_items i
                    join orders o on o.id = i.order_id
                    where o.created_at >= :start and o.created_at < :end
                      and (cast(:vendorId as varchar) is null or o.vendor_id = :vendorId)
                    group by i.product_id
                    order by revenue desc, productId
                    limit :limit
                    """, nativeQuery = true)
    List<ProductRow> topProducts(Instant start, Instant end, String vendorId, int limit);

    /** The vendors that brought the most money, for the marketplace view. */
    @Query(value = """
                    select o.vendor_id as vendorId,
                           count(*) as orderCount,
                           cast(sum(o.total_amount) as bigint) as revenue
                    from orders o
                    where o.created_at >= :start and o.created_at < :end
                    group by o.vendor_id
                    order by revenue desc, vendorId
                    limit :limit
                    """, nativeQuery = true)
    List<VendorRow> topVendors(Instant start, Instant end, int limit);

    interface TotalsRow {
        long getOrderCount();

        long getRevenue();

        long getBuyerCount();
    }

    interface DailyRow {
        LocalDate getDay();

        long getOrderCount();

        long getRevenue();
    }

    interface StatusRow {
        String getStatus();

        long getOrderCount();
    }

    interface ProductRow {
        String getProductId();

        String getProductName();

        long getQuantity();

        long getRevenue();
    }

    interface VendorRow {
        String getVendorId();

        long getOrderCount();

        long getRevenue();
    }
}
