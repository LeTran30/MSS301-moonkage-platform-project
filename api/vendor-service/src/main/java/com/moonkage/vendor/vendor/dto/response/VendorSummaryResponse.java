package com.moonkage.vendor.vendor.dto.response;

import com.moonkage.vendor.vendor.VendorStatus;
import java.util.List;

/**
 * What a buyer may read about a shop without being its owner (B-3.2).
 *
 * <p>Only the fields the public catalogue needs are here: the id, the display name, the head-office province, the
 * review state, the selling flags and the provinces the shop delivers to. Nothing private crosses this boundary: no
 * tax code, no address, no representative, no bank account, no document and no admin note (NFR-03).
 *
 * @param provinceCode the head-office province of the shop; null only for a copy written before the field existed
 * @param canOperate approved and registration fee paid (BR-20, BR-31)
 * @param deliveryAreas province codes the shop delivers to (FR-28)
 */
public record VendorSummaryResponse(
        String id,
        String businessName,
        String provinceCode,
        VendorStatus status,
        boolean canOperate,
        boolean sellsShop,
        boolean acceptsOrders,
        List<String> deliveryAreas) {}
