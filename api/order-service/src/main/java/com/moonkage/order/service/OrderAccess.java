package com.moonkage.order.service;

import com.moonkage.order.entity.Order;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.OrderRepository;
import com.moonkage.order.security.CurrentUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Who may do what on an order: its buyer, the owner of its vendor, an admin. Anyone else gets ORDER_NOT_FOUND, so an
 * order's existence does not leak.
 */
@Component
@RequiredArgsConstructor
public class OrderAccess {

    private final OrderRepository orderRepository;
    private final VendorDirectory vendorDirectory;

    /** Buyer, vendor owner or admin. */
    public Order readable(CurrentUserInfo caller, String orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(OrderAccess::notFound);
        if (!caller.isAdmin() && !isBuyer(caller, order) && !isVendorOwner(caller, order)) {
            throw notFound();
        }
        return order;
    }

    /** The buyer only; the row locked for the change. */
    public Order forBuyer(CurrentUserInfo caller, String orderId) {
        Order order = orderRepository.findForUpdateById(orderId).orElseThrow(OrderAccess::notFound);
        if (!isBuyer(caller, order)) {
            throw caller.isAdmin() || isVendorOwner(caller, order)
                    ? new AppException(ErrorCode.ACCESS_DENIED)
                    : notFound();
        }
        return order;
    }

    /** The owner of the order's vendor only; the row locked for the change. */
    public Order forVendor(CurrentUserInfo caller, String orderId) {
        Order order = orderRepository.findForUpdateById(orderId).orElseThrow(OrderAccess::notFound);
        if (!isVendorOwner(caller, order)) {
            throw caller.isAdmin() || isBuyer(caller, order) ? new AppException(ErrorCode.ACCESS_DENIED) : notFound();
        }
        return order;
    }

    /** An admin only; the row locked for the change. */
    public Order forAdmin(CurrentUserInfo caller, String orderId) {
        if (!caller.isAdmin()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return orderRepository.findForUpdateById(orderId).orElseThrow(OrderAccess::notFound);
    }

    public boolean isBuyer(CurrentUserInfo caller, Order order) {
        return order.getBuyerAccountId().equals(caller.accountId());
    }

    public boolean isVendorOwner(CurrentUserInfo caller, Order order) {
        return vendorDirectory
                .ownedVendorId(caller.accountId())
                .filter(order.getVendorId()::equals)
                .isPresent();
    }

    private static AppException notFound() {
        return new AppException(ErrorCode.ORDER_NOT_FOUND);
    }
}
