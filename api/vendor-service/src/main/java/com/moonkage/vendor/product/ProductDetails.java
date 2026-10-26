package com.moonkage.vendor.product;

import com.moonkage.vendor.cakeattribute.CakeAttributeGroup;
import com.moonkage.vendor.cakeattribute.CakeAttributeRef;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.common.vo.PriceTiers;
import com.moonkage.vendor.common.vo.Quantity;
import com.moonkage.vendor.vendor.SupplySource;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.util.StringUtils;

/**
 * Everything a Shop writes about a product (AC-29.1, AC-29.2, AC-29.4, FR-31), complete, so a product is never made
 * or edited into one that misses a required field: name, description, at least one image, list price, stock of 0
 * or more, expiry date, delivery label, at least one crust and one filling (BR-34), a brand, and an origin when
 * resold. Texts are trimmed, an empty optional text is null. An error names its request field.
 *
 * @param imageKeys in display order: keys the product already has or new uploads, until {@link #withImageKeys}
 *     puts the final keys
 * @param quoteThreshold the quantity from which a buyer sends a request instead (AC-31.2); without effect while the
 *     vendor does not accept orders (AC-31.3), so it is kept as written
 */
record ProductDetails(
        String name,
        String description,
        String brand,
        String origin,
        boolean resold,
        Quantity piecesPerBox,
        Price listPrice,
        int stock,
        LocalDate expiryDate,
        DeliveryLabel deliveryLabel,
        Quantity quoteThreshold,
        PriceTiers priceTiers,
        List<String> imageKeys,
        List<CakeAttributeRef> crusts,
        List<CakeAttributeRef> fillings) {

    static final String NAME = "name";
    static final String DESCRIPTION = "description";
    static final String BRAND = "brand";
    static final String ORIGIN = "origin";
    static final String RESOLD = "resold";
    static final String PIECES_PER_BOX = "piecesPerBox";
    static final String LIST_PRICE = "listPrice";
    static final String STOCK = "stock";
    static final String EXPIRY_DATE = "expiryDate";
    static final String DELIVERY_LABEL = "deliveryLabel";
    static final String QUOTE_THRESHOLD = "quoteThreshold";
    static final String PRICE_TIERS = "priceTiers";
    static final String IMAGE_KEYS = "imageKeys";
    static final String CRUST_CODES = "crustCodes";
    static final String FILLING_CODES = "fillingCodes";

    ProductDetails {
        name = requireText(NAME, name, ProductConstant.TEXT_MAX_LENGTH);
        description = requireText(DESCRIPTION, description, ProductConstant.DESCRIPTION_MAX_LENGTH);
        brand = requireText(BRAND, brand, ProductConstant.TEXT_MAX_LENGTH);
        origin = optionalText(ORIGIN, origin, ProductConstant.TEXT_MAX_LENGTH);
        if (resold && origin == null) {
            throw new AppException(ErrorCode.RESALE_TERM_REQUIRED).atField(ORIGIN);
        }
        require(listPrice != null, LIST_PRICE);
        if (stock < 0) {
            throw new AppException(ErrorCode.STOCK_INVALID).atField(STOCK);
        }
        require(expiryDate != null, EXPIRY_DATE);
        require(deliveryLabel != null, DELIVERY_LABEL);
        priceTiers = priceTiers == null ? PriceTiers.of(List.of()) : priceTiers;
        imageKeys = checkImages(imageKeys);
        crusts = only(CakeAttributeGroup.CRUST, crusts);
        fillings = only(CakeAttributeGroup.FILLING, fillings);
        require(!crusts.isEmpty(), CRUST_CODES);
        require(!fillings.isEmpty(), FILLING_CODES);
    }

    /**
     * Applies the vendor's supply source: RESELL is always resold, SELF_PRODUCED never, BOTH chooses per product
     * (AC-29.2). A resold product needs its brand; any other with an empty brand takes the vendor's business name
     * (BR-12, AC-29.4, AC-33.5).
     */
    static ProductDetails of(
            SupplySource supplySource,
            String businessName,
            Boolean resold,
            String name,
            String description,
            String brand,
            String origin,
            Quantity piecesPerBox,
            Price listPrice,
            Integer stock,
            LocalDate expiryDate,
            DeliveryLabel deliveryLabel,
            Quantity quoteThreshold,
            PriceTiers priceTiers,
            List<String> imageKeys,
            List<CakeAttributeRef> crusts,
            List<CakeAttributeRef> fillings) {
        boolean isResold = resoldOf(supplySource, resold);
        String brandOrDefault = StringUtils.hasText(brand) ? brand : null;
        if (brandOrDefault == null) {
            if (isResold) {
                throw new AppException(ErrorCode.RESALE_TERM_REQUIRED).atField(BRAND);
            }
            brandOrDefault = businessName;
        }
        require(stock != null, STOCK);
        return new ProductDetails(
                name,
                description,
                brandOrDefault,
                origin,
                isResold,
                piecesPerBox,
                listPrice,
                stock,
                expiryDate,
                deliveryLabel,
                quoteThreshold,
                priceTiers,
                imageKeys,
                crusts,
                fillings);
    }

    /** The same details with the images at their final keys (new uploads moved). */
    ProductDetails withImageKeys(List<String> finalKeys) {
        return new ProductDetails(
                name,
                description,
                brand,
                origin,
                resold,
                piecesPerBox,
                listPrice,
                stock,
                expiryDate,
                deliveryLabel,
                quoteThreshold,
                priceTiers,
                finalKeys,
                crusts,
                fillings);
    }

    /** Crusts and fillings together, as the product links them. */
    List<CakeAttributeRef> cakeAttributes() {
        return Stream.concat(crusts.stream(), fillings.stream()).toList();
    }

    private static boolean resoldOf(SupplySource supplySource, Boolean resold) {
        return switch (supplySource) {
            case RESELL -> allowed(resold, true, supplySource);
            case SELF_PRODUCED -> allowed(resold, false, supplySource);
            case BOTH -> {
                require(resold != null, RESOLD);
                yield resold;
            }
        };
    }

    /** Left out is the only value the supply source allows; sent, it must be that value. */
    private static boolean allowed(Boolean resold, boolean only, SupplySource supplySource) {
        if (resold != null && resold != only) {
            throw new AppException(ErrorCode.RESOLD_NOT_ALLOWED, supplySource.name()).atField(RESOLD);
        }
        return only;
    }

    private static List<String> checkImages(List<String> keys) {
        if (keys == null
                || keys.isEmpty()
                || keys.size() > ProductConstant.MAX_IMAGES
                || new HashSet<>(keys).size() != keys.size()) {
            throw new AppException(ErrorCode.PRODUCT_IMAGE_COUNT_INVALID, ProductConstant.MAX_IMAGES)
                    .atField(IMAGE_KEYS);
        }
        return List.copyOf(keys);
    }

    private static List<CakeAttributeRef> only(CakeAttributeGroup group, List<CakeAttributeRef> values) {
        if (values == null) {
            return List.of();
        }
        if (values.stream().anyMatch(value -> value.group() != group)) {
            throw new IllegalArgumentException("Not all values are of group " + group);
        }
        return List.copyOf(values);
    }

    private static String requireText(String field, String text, int maxLength) {
        String value = optionalText(field, text, maxLength);
        require(value != null, field);
        return value;
    }

    private static String optionalText(String field, String text, int maxLength) {
        if (!StringUtils.hasText(text)) {
            return null;
        }
        String value = text.trim();
        if (value.length() > maxLength) {
            throw new AppException(ErrorCode.TEXT_TOO_LONG, maxLength).atField(field);
        }
        return value;
    }

    private static void require(boolean present, String field) {
        if (!present) {
            throw new AppException(ErrorCode.FIELD_REQUIRED).atField(field);
        }
    }
}
