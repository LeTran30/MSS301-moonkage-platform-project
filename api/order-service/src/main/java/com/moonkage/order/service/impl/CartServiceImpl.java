package com.moonkage.order.service.impl;

import com.moonkage.order.client.CatalogClient;
import com.moonkage.order.client.dto.ProductSnapshotRequest;
import com.moonkage.order.client.dto.ProductSnapshotResponse;
import com.moonkage.order.client.dto.ProductSnapshotResponse.ProductPart;
import com.moonkage.order.client.dto.ProductSnapshotResponse.VendorPart;
import com.moonkage.order.dto.request.AddCartItemRequest;
import com.moonkage.order.dto.request.UpdateCartItemRequest;
import com.moonkage.order.dto.response.CartResponse;
import com.moonkage.order.entity.CartItem;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.CartItemRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.CartService;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final CatalogClient catalogClient;

    @Override
    @Transactional(readOnly = true)
    public CartResponse get(CurrentUserInfo caller, String provinceCode) {
        List<CartItem> items = cartItemRepository.findByBuyerAccountIdOrderByCreatedAtAsc(caller.accountId());
        if (items.isEmpty()) {
            return new CartResponse(provinceCode, List.of(), 0L);
        }
        ProductSnapshotResponse snapshot = catalogClient.snapshot(new ProductSnapshotRequest(
                provinceCode, items.stream().map(CartItem::getProductId).toList()));

        Map<String, List<CartResponse.Line>> linesByVendor = new LinkedHashMap<>();
        Map<String, Long> subtotalByVendor = new LinkedHashMap<>();
        for (CartItem item : items) {
            ProductPart product = snapshot.product(item.getProductId()).orElse(null);
            CartResponse.Line line = toLine(item, product);
            linesByVendor
                    .computeIfAbsent(item.getVendorId(), id -> new ArrayList<>())
                    .add(line);
            subtotalByVendor.merge(item.getVendorId(), line.unitPrice() * line.quantity(), Long::sum);
        }

        List<CartResponse.Group> groups = new ArrayList<>();
        long total = 0L;
        for (Map.Entry<String, List<CartResponse.Line>> entry : linesByVendor.entrySet()) {
            String vendorId = entry.getKey();
            VendorPart vendor = snapshot.vendor(vendorId).orElse(null);
            boolean deliverable = vendor != null && vendor.deliverable();
            long subtotal = subtotalByVendor.get(vendorId);
            Long fee = deliverable ? vendor.shippingFee() : null;
            groups.add(new CartResponse.Group(
                    vendorId,
                    vendor == null ? null : vendor.vendorName(),
                    deliverable,
                    vendor != null && vendor.interprovince(),
                    fee,
                    subtotal,
                    entry.getValue()));
            if (deliverable) {
                total += subtotal + fee;
            }
        }
        return new CartResponse(provinceCode, groups, total);
    }

    @Override
    @Transactional
    public CartResponse.Line addItem(CurrentUserInfo caller, AddCartItemRequest request) {
        ProductPart product = purchasable(caller, request.productId());
        CartItem item = cartItemRepository
                .findByBuyerAccountIdAndProductId(caller.accountId(), request.productId())
                .orElseGet(() -> newItem(caller, product));
        int quantity = (item.getQuantity() == null ? 0 : item.getQuantity()) + request.quantity();
        checkQuantity(product, quantity);
        item.setQuantity(quantity);
        return toLine(cartItemRepository.save(item), product);
    }

    @Override
    @Transactional
    public CartResponse.Line updateItem(CurrentUserInfo caller, String itemId, UpdateCartItemRequest request) {
        CartItem item = cartItemRepository
                .findByIdAndBuyerAccountId(itemId, caller.accountId())
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_FOUND));
        ProductPart product = purchasable(caller, item.getProductId());
        checkQuantity(product, request.quantity());
        item.setQuantity(request.quantity());
        return toLine(cartItemRepository.save(item), product);
    }

    @Override
    @Transactional
    public void removeItem(CurrentUserInfo caller, String itemId) {
        CartItem item = cartItemRepository
                .findByIdAndBuyerAccountId(itemId, caller.accountId())
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_FOUND));
        cartItemRepository.delete(item);
    }

    /** The product as catalog shows it, if the caller may buy it now (BR-20, BR-21, BR-22). */
    private ProductPart purchasable(CurrentUserInfo caller, String productId) {
        ProductPart product = catalogClient
                .snapshot(new ProductSnapshotRequest(null, List.of(productId)))
                .product(productId)
                .filter(ProductPart::purchasable)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_AVAILABLE));
        if (caller.accountId().equals(product.ownerAccountId())) {
            throw new AppException(ErrorCode.OWN_PRODUCT);
        }
        return product;
    }

    /** AC-08.2: within the stock on sale and below the quote threshold, else the buyer sends a request (BR-03). */
    private static void checkQuantity(ProductPart product, int quantity) {
        if (product.quoteThreshold() != null && quantity >= product.quoteThreshold()) {
            throw new AppException(ErrorCode.QUANTITY_NEEDS_QUOTE, product.quoteThreshold());
        }
        if (quantity > product.stock()) {
            throw new AppException(ErrorCode.QUANTITY_OVER_STOCK, product.stock());
        }
    }

    private static CartItem newItem(CurrentUserInfo caller, ProductPart product) {
        CartItem item = new CartItem();
        item.setBuyerAccountId(caller.accountId());
        item.setProductId(product.productId());
        item.setVendorId(product.vendorId());
        return item;
    }

    /** A product catalog no longer has stays in the cart, marked not available, until the buyer removes it. */
    private static CartResponse.Line toLine(CartItem item, ProductPart product) {
        boolean available = product != null && product.purchasable() && item.getQuantity() <= product.stock();
        return new CartResponse.Line(
                item.getId(),
                item.getProductId(),
                product == null ? null : product.name(),
                product == null ? 0L : product.listPrice(),
                item.getQuantity(),
                available);
    }
}
