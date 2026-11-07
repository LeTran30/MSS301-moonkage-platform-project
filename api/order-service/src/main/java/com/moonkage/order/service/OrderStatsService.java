package com.moonkage.order.service;

import com.moonkage.order.dto.response.OrderStatsResponse;
import com.moonkage.order.security.CurrentUserInfo;
import java.time.LocalDate;

/** The order report of the admin and vendor dashboards. */
public interface OrderStatsService {

    /**
     * The orders created from {@code from} to {@code to}, both included. {@code to} null is today, {@code from} null
     * is order.stats-default-days before it. {@code vendorId}: the caller's own Shop, or any for an admin; null is
     * the whole marketplace, for an admin only.
     */
    OrderStatsResponse stats(CurrentUserInfo caller, LocalDate from, LocalDate to, String vendorId);
}
