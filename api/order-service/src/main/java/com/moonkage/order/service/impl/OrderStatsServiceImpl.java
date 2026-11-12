package com.moonkage.order.service.impl;

import com.moonkage.order.client.dto.VendorView;
import com.moonkage.order.client.facade.VendorDirectory;
import com.moonkage.order.config.OrderProperties;
import com.moonkage.order.dto.response.OrderStatsResponse;
import com.moonkage.order.dto.response.OrderStatsResponse.DailyPoint;
import com.moonkage.order.dto.response.OrderStatsResponse.StatusCount;
import com.moonkage.order.dto.response.OrderStatsResponse.TopProduct;
import com.moonkage.order.dto.response.OrderStatsResponse.TopVendor;
import com.moonkage.order.dto.response.OrderStatsResponse.Totals;
import com.moonkage.order.enums.OrderStatus;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.OrderStatsRepository;
import com.moonkage.order.repository.OrderStatsRepository.DailyRow;
import com.moonkage.order.repository.OrderStatsRepository.TotalsRow;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.OrderStatsService;
import feign.FeignException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderStatsServiceImpl implements OrderStatsService {

    private final OrderStatsRepository statsRepository;
    private final VendorDirectory vendorDirectory;
    private final OrderProperties properties;

    @Override
    @Transactional(readOnly = true)
    public OrderStatsResponse stats(CurrentUserInfo caller, LocalDate from, LocalDate to, String vendorId) {
        requireAllowed(caller, vendorId);
        ZoneId zone = properties.getStatsZone();
        LocalDate last = to != null ? to : LocalDate.now(zone);
        LocalDate first = from != null ? from : last.minusDays(properties.getStatsDefaultDays() - 1L);
        long days = ChronoUnit.DAYS.between(first, last) + 1;
        if (days < 1 || days > properties.getStatsMaxDays()) {
            throw new AppException(ErrorCode.STATS_RANGE_INVALID, properties.getStatsMaxDays());
        }
        Instant start = first.atStartOfDay(zone).toInstant();
        Instant end = last.plusDays(1).atStartOfDay(zone).toInstant();
        int top = properties.getStatsTopSize();

        TotalsRow totals = statsRepository.totals(start, end, vendorId);
        return new OrderStatsResponse(
                first,
                last,
                vendorId,
                new Totals(
                        totals.getOrderCount(),
                        totals.getRevenue(),
                        totals.getBuyerCount(),
                        totals.getOrderCount() == 0 ? 0 : totals.getRevenue() / totals.getOrderCount()),
                everyDay(first, last, statsRepository.daily(start, end, vendorId, zone.getId())),
                statsRepository.byStatus(start, end, vendorId).stream()
                        .map(r -> new StatusCount(OrderStatus.valueOf(r.getStatus()), r.getOrderCount()))
                        .toList(),
                statsRepository.topProducts(start, end, vendorId, top).stream()
                        .map(r -> new TopProduct(r.getProductId(), r.getProductName(), r.getQuantity(), r.getRevenue()))
                        .toList(),
                vendorId != null
                        ? List.of()
                        : statsRepository.topVendors(start, end, top).stream()
                                .map(r -> new TopVendor(
                                        r.getVendorId(),
                                        vendorName(r.getVendorId()),
                                        r.getOrderCount(),
                                        r.getRevenue()))
                                .toList());
    }

    /** Same rule as the order list: a vendor's report for its owner or an admin, the marketplace for an admin. */
    private void requireAllowed(CurrentUserInfo caller, String vendorId) {
        if (caller.isAdmin()) {
            return;
        }
        boolean owner = vendorId != null
                && vendorDirectory
                        .ownedVendorId(caller.accountId())
                        .filter(vendorId::equals)
                        .isPresent();
        if (!owner) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }

    /** The rows of the days with orders, plus a zero row for every day without. */
    static List<DailyPoint> everyDay(LocalDate first, LocalDate last, List<DailyRow> rows) {
        Map<LocalDate, DailyRow> byDay = rows.stream().collect(Collectors.toMap(DailyRow::getDay, Function.identity()));
        return first.datesUntil(last.plusDays(1))
                .map(day -> {
                    DailyRow row = byDay.get(day);
                    return row == null
                            ? new DailyPoint(day, 0, 0)
                            : new DailyPoint(day, row.getOrderCount(), row.getRevenue());
                })
                .toList();
    }

    /** The name for the chart label; null when vendor-service cannot answer, the report still loads. */
    private String vendorName(String vendorId) {
        try {
            return vendorDirectory.find(vendorId).map(VendorView::businessName).orElse(null);
        } catch (FeignException e) {
            log.warn("Name of vendor {} unknown for the stats: {}", vendorId, e.getMessage());
            return null;
        }
    }
}
