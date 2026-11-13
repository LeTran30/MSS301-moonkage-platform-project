package com.moonkage.order.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.order.client.dto.VendorView;
import com.moonkage.order.client.facade.VendorDirectory;
import com.moonkage.order.config.OrderProperties;
import com.moonkage.order.dto.response.OrderStatsResponse;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.OrderStatsRepository;
import com.moonkage.order.repository.OrderStatsRepository.DailyRow;
import com.moonkage.order.repository.OrderStatsRepository.TotalsRow;
import com.moonkage.order.repository.OrderStatsRepository.VendorRow;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.security.Role;
import com.moonkage.order.service.impl.OrderStatsServiceImpl;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OrderStatsServiceImplTest {

    private static final String VENDOR_ID = "vendor-1";
    private static final CurrentUserInfo ADMIN = new CurrentUserInfo("admin-1", Role.ADMIN);
    private static final CurrentUserInfo OWNER = new CurrentUserInfo("owner-1", Role.MEMBER);
    private static final LocalDate FROM = LocalDate.of(2026, 11, 1);
    private static final LocalDate TO = LocalDate.of(2026, 11, 3);

    private final OrderStatsRepository repository = mock(OrderStatsRepository.class);
    private final VendorDirectory vendorDirectory = mock(VendorDirectory.class);
    private final OrderProperties properties = new OrderProperties();
    private OrderStatsServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new OrderStatsServiceImpl(repository, vendorDirectory, properties);
        TotalsRow totals = totals(4, 1_000_001, 3);
        when(repository.totals(any(), any(), any())).thenReturn(totals);
        when(vendorDirectory.ownedVendorId(OWNER.accountId())).thenReturn(Optional.of(VENDOR_ID));
    }

    @Test
    void ownerSeesOwnShopWithEveryDayFilledAndNoVendorRanking() {
        DailyRow second = day(FROM.plusDays(1), 4);
        when(repository.daily(any(), any(), eq(VENDOR_ID), anyString())).thenReturn(List.of(second));

        OrderStatsResponse stats = service.stats(OWNER, FROM, TO, VENDOR_ID);

        assertEquals(
                List.of(0L, 4L, 0L),
                stats.daily().stream().map(d -> d.orderCount()).toList());
        assertEquals(
                List.of(FROM, FROM.plusDays(1), TO),
                stats.daily().stream().map(d -> d.date()).toList());
        assertEquals(250_000, stats.totals().averageOrderValue());
        assertTrue(stats.topVendors().isEmpty());
        verify(repository, never()).topVendors(any(), any(), anyInt());
    }

    @Test
    void rangeIsCutAtMidnightInTheReportZone() {
        service.stats(ADMIN, FROM, TO, null);

        verify(repository).totals(Instant.parse("2026-10-31T17:00:00Z"), Instant.parse("2026-11-03T17:00:00Z"), null);
    }

    @Test
    void memberWithoutAShopOrForAnotherShopIsDenied() {
        assertEquals(
                ErrorCode.ACCESS_DENIED,
                assertThrows(AppException.class, () -> service.stats(OWNER, FROM, TO, null))
                        .getErrorCode());
        assertEquals(
                ErrorCode.ACCESS_DENIED,
                assertThrows(AppException.class, () -> service.stats(OWNER, FROM, TO, "vendor-2"))
                        .getErrorCode());
    }

    @Test
    void adminMarketplaceNamesTheTopVendors() {
        VendorRow row = mock(VendorRow.class);
        when(row.getVendorId()).thenReturn(VENDOR_ID);
        when(row.getRevenue()).thenReturn(900_000L);
        when(repository.topVendors(any(), any(), eq(properties.getStatsTopSize())))
                .thenReturn(List.of(row));
        when(vendorDirectory.find(VENDOR_ID))
                .thenReturn(Optional.of(new VendorView(VENDOR_ID, "o", "Trăng Vàng", true)));

        OrderStatsResponse stats = service.stats(ADMIN, FROM, TO, null);

        assertEquals("Trăng Vàng", stats.topVendors().getFirst().vendorName());
        verify(repository).topProducts(any(), any(), isNull(), eq(properties.getStatsTopSize()));
    }

    @Test
    void defaultRangeIsTheLastDaysUpToToday() {
        OrderStatsResponse stats = service.stats(ADMIN, null, TO, null);

        assertEquals(TO.minusDays(properties.getStatsDefaultDays() - 1L), stats.from());
        assertEquals(properties.getStatsDefaultDays(), stats.daily().size());
    }

    @Test
    void reversedOrTooLongRangeIsRejected() {
        assertEquals(
                ErrorCode.STATS_RANGE_INVALID,
                assertThrows(AppException.class, () -> service.stats(ADMIN, TO, FROM, null))
                        .getErrorCode());
        LocalDate tooEarly = TO.minusDays(properties.getStatsMaxDays());
        assertEquals(
                ErrorCode.STATS_RANGE_INVALID,
                assertThrows(AppException.class, () -> service.stats(ADMIN, tooEarly, TO, null))
                        .getErrorCode());
    }

    private static TotalsRow totals(long orders, long revenue, long buyers) {
        TotalsRow row = mock(TotalsRow.class);
        when(row.getOrderCount()).thenReturn(orders);
        when(row.getRevenue()).thenReturn(revenue);
        when(row.getBuyerCount()).thenReturn(buyers);
        return row;
    }

    private static DailyRow day(LocalDate date, long orders) {
        DailyRow row = mock(DailyRow.class);
        when(row.getDay()).thenReturn(date);
        when(row.getOrderCount()).thenReturn(orders);
        return row;
    }
}
