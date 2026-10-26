package com.moonkage.vendor.product;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Quantity;
import com.moonkage.vendor.product.dto.request.ReserveStockRequest;
import com.moonkage.vendor.product.dto.response.StockReservationResponse;
import com.moonkage.vendor.vendor.VendorService;
import com.moonkage.vendor.vendor.VendorView;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Locks the products of a checkout first, in id order, then its lines: every path takes the same locks in the same
 * order, so two checkouts never deadlock, and two calls for one checkout run one after the other.
 */
@Service
@RequiredArgsConstructor
class StockServiceImpl implements StockService {

    private static final String FIELD_ITEMS = "items";
    private static final String FIELD_EXPIRES_AT = "expiresAt";

    private final StockReservationRepository reservationRepository;
    private final ProductRepository productRepository;
    private final VendorService vendorService;
    private final ProductSnapshotPublisher snapshotPublisher;

    @Override
    @Transactional
    public StockReservationResponse reserve(ReserveStockRequest request) {
        Map<String, Quantity> wanted = toWanted(request.items());
        Map<String, Product> products = lockProducts(wanted.keySet());
        List<StockReservation> held = reservationRepository.findForChangeByCheckoutId(request.checkoutId());
        if (!held.isEmpty()) {
            if (!wanted.equals(toQuantities(held))) {
                throw new AppException(ErrorCode.RESERVATION_MISMATCH);
            }
            return toResponse(held, products);
        }
        if (!request.expiresAt().isAfter(Instant.now())) {
            throw new AppException(ErrorCode.RESERVATION_EXPIRY_INVALID).atField(FIELD_EXPIRES_AT);
        }
        checkAvailable(wanted, products);
        List<StockReservation> lines = wanted.entrySet().stream()
                .map(line -> StockReservation.hold(
                        request.checkoutId(), products.get(line.getKey()), line.getValue(), request.expiresAt()))
                .toList();
        reservationRepository.saveAll(lines);
        announce(products.values());
        return toResponse(lines, products);
    }

    @Override
    @Transactional
    public StockReservationResponse commit(String checkoutId) {
        Lines lines = lock(checkoutId);
        if (lines.reservations().isEmpty()) {
            throw new AppException(ErrorCode.RESERVATION_NOT_FOUND);
        }
        Map<String, Quantity> retaken = lines.reservations().stream()
                .filter(StockReservation::needsStockToCommit)
                .collect(Collectors.toMap(StockReservation::getProductId, StockReservation::getQty));
        if (lines.status() != ReservationStatus.COMMITTED) {
            checkAvailable(retaken, lines.products());
            lines.reservations().forEach(line -> line.commit(lines.products().get(line.getProductId())));
            announce(retaken.keySet().stream().map(lines.products()::get).toList());
        }
        return toResponse(lines.reservations(), lines.products());
    }

    @Override
    @Transactional
    public void release(String checkoutId) {
        Lines lines = lock(checkoutId);
        if (lines.status() == ReservationStatus.COMMITTED) {
            throw new AppException(ErrorCode.RESERVATION_COMMITTED);
        }
        releaseHeld(lines);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> findExpiredCheckouts(Instant now, int limit) {
        return reservationRepository.findExpiredCheckoutIds(ReservationStatus.HELD, now, PageRequest.of(0, limit));
    }

    @Override
    @Transactional
    public void releaseIfExpired(String checkoutId, Instant now) {
        Lines lines = lock(checkoutId);
        boolean expired = lines.reservations().stream()
                .allMatch(line -> line.getExpiresAt().isBefore(now));
        if (lines.status() == ReservationStatus.HELD && expired) {
            releaseHeld(lines);
        }
    }

    private void releaseHeld(Lines lines) {
        if (lines.status() != ReservationStatus.HELD) {
            return;
        }
        lines.reservations().forEach(line -> line.release(lines.products().get(line.getProductId())));
        announce(lines.products().values());
    }

    /** Each product once (RESERVATION_ITEMS_INVALID otherwise), in id order. */
    private static Map<String, Quantity> toWanted(List<ReserveStockRequest.Item> items) {
        Map<String, Quantity> wanted = new TreeMap<>();
        for (ReserveStockRequest.Item item : items) {
            if (wanted.put(item.productId(), Quantity.of(item.qty())) != null) {
                throw new AppException(ErrorCode.RESERVATION_ITEMS_INVALID).atField(FIELD_ITEMS);
            }
        }
        return wanted;
    }

    private static Map<String, Quantity> toQuantities(List<StockReservation> lines) {
        return lines.stream().collect(Collectors.toMap(StockReservation::getProductId, StockReservation::getQty));
    }

    /**
     * STOCK_UNAVAILABLE at each product that cannot be sold in that quantity now: missing, not on sale, short, or of
     * a Shop that may not sell (locked, not paid, Shop turned off: BR-20, BR-21, BR-31).
     */
    private void checkAvailable(Map<String, Quantity> wanted, Map<String, Product> products) {
        Map<String, Boolean> sellingByVendor = new HashMap<>();
        List<String> unavailable = new ArrayList<>();
        wanted.forEach((productId, qty) -> {
            Product product = products.get(productId);
            boolean available = product != null
                    && product.canSupply(qty.value())
                    && sellingByVendor.computeIfAbsent(product.getVendorId(), this::sells);
            if (!available) {
                unavailable.add(productId);
            }
        });
        if (!unavailable.isEmpty()) {
            throw new AppException(ErrorCode.STOCK_UNAVAILABLE).atFields(unavailable);
        }
    }

    private boolean sells(String vendorId) {
        VendorView vendor = vendorService.getView(vendorId);
        return vendor.canOperate() && vendor.sellsShop();
    }

    private Map<String, Product> lockProducts(Collection<String> productIds) {
        return productRepository.findForChangeByIdIn(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
    }

    /** The checkout's products, then its lines, both locked; no lines for an unknown checkout. */
    private Lines lock(String checkoutId) {
        List<String> productIds = reservationRepository.findByCheckoutIdOrderByProductId(checkoutId).stream()
                .map(StockReservation::getProductId)
                .toList();
        if (productIds.isEmpty()) {
            return new Lines(List.of(), Map.of());
        }
        Map<String, Product> products = lockProducts(productIds);
        return new Lines(reservationRepository.findForChangeByCheckoutId(checkoutId), products);
    }

    /** product.upserted for each product whose stock moved, at the version the flush gives it. */
    private void announce(Collection<Product> products) {
        productRepository.flush();
        products.forEach(snapshotPublisher::announceUpserted);
    }

    private static StockReservationResponse toResponse(List<StockReservation> lines, Map<String, Product> products) {
        StockReservation first = lines.getFirst();
        return new StockReservationResponse(
                first.getCheckoutId(),
                first.getStatus(),
                first.getExpiresAt(),
                lines.stream()
                        .map(line -> new StockReservationResponse.Item(
                                line.getProductId(),
                                products.get(line.getProductId()).getVendorId(),
                                line.getQty().value(),
                                line.getUnitPrice().value()))
                        .toList());
    }

    /**
     * The lines of one checkout, all in one status: every change moves all of them together.
     *
     * @param products by id, locked
     */
    private record Lines(List<StockReservation> reservations, Map<String, Product> products) {

        /** null for an unknown checkout. */
        ReservationStatus status() {
            return reservations.isEmpty() ? null : reservations.getFirst().getStatus();
        }
    }
}
