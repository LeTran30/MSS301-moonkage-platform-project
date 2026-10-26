package com.moonkage.quotation.service.impl;

import com.moonkage.quotation.entity.Quote;
import com.moonkage.quotation.entity.QuoteItem;
import com.moonkage.quotation.entity.QuoteRequest;
import com.moonkage.quotation.entity.QuoteTerms;
import com.moonkage.quotation.entity.VendorSnapshot;
import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.enums.RequestType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.springframework.beans.BeanUtils;
import org.springframework.test.util.ReflectionTestUtils;

/** Entities as the database would return them: ids set, vendor copies filled as vendor.updated would. */
final class Fixtures {

    static final Instant NOW = Instant.parse("2026-10-26T03:00:00Z");
    static final LocalDate DEADLINE = LocalDate.parse("2026-11-20");
    static final String BUYER = "buyer-1";
    static final String OWNER = "owner-1";
    static final String VENDOR = "vendor-1";

    private Fixtures() {}

    static VendorSnapshot vendor(String vendorId, String ownerAccountId) {
        VendorSnapshot vendor = BeanUtils.instantiateClass(VendorSnapshot.class);
        ReflectionTestUtils.setField(vendor, "vendorId", vendorId);
        ReflectionTestUtils.setField(vendor, "ownerAccountId", ownerAccountId);
        ReflectionTestUtils.setField(vendor, "businessName", "Tiệm " + vendorId);
        ReflectionTestUtils.setField(vendor, "taxCode", "0312345678");
        ReflectionTestUtils.setField(vendor, "status", "APPROVED");
        ReflectionTestUtils.setField(vendor, "canOperate", true);
        ReflectionTestUtils.setField(vendor, "sellsShop", true);
        ReflectionTestUtils.setField(vendor, "acceptsOrders", true);
        ReflectionTestUtils.setField(vendor, "supplySource", "BOTH");
        ReflectionTestUtils.setField(vendor, "deliveryAreas", List.of("79"));
        ReflectionTestUtils.setField(vendor, "minQty", 50);
        ReflectionTestUtils.setField(vendor, "refPriceTiers", "[{\"fromQty\":50,\"unitPrice\":120000}]");
        ReflectionTestUtils.setField(vendor, "customCapabilities", List.of("BAG", "CARD"));
        ReflectionTestUtils.setField(vendor, "productionProfile", "{}");
        ReflectionTestUtils.setField(vendor, "updatedAt", NOW);
        return vendor;
    }

    static VendorSnapshot set(VendorSnapshot vendor, String field, Object value) {
        ReflectionTestUtils.setField(vendor, field, value);
        return vendor;
    }

    static QuoteRequest request(String id, RequestType type, int quantity, Set<CustomType> customTypes) {
        QuoteRequest request = QuoteRequest.open(
                BUYER, type, type == RequestType.DIRECT ? VENDOR : null, null, quantity, null, DEADLINE);
        request.deliverTo("Nguyễn Thị Lan", "0901000001", "79", "12 Lê Lợi");
        request.customize(customTypes, null);
        ReflectionTestUtils.setField(request, "id", id);
        ReflectionTestUtils.setField(request, "createdAt", NOW);
        return request;
    }

    /** 100 boxes at 120.000đ + 30.000đ shipping, 30% deposit, valid 7 days. */
    static Quote quote(String id, String requestId, String vendorId, Quote previous) {
        QuoteTerms terms = QuoteTerms.compute(
                List.of(QuoteItem.product("Hộp 4 bánh", null, 100, 120_000)),
                30_000,
                new BigDecimal("30"),
                DEADLINE,
                "Giao tận nơi",
                NOW.plusSeconds(7 * 24 * 3600),
                null);
        Quote quote = Quote.submit(requestId, vendorId, previous, terms, NOW);
        ReflectionTestUtils.setField(quote, "id", id);
        return quote;
    }
}
