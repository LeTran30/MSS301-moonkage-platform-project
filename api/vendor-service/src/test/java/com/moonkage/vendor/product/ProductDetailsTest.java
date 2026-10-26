package com.moonkage.vendor.product;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.vendor.cakeattribute.CakeAttributeCode;
import com.moonkage.vendor.cakeattribute.CakeAttributeGroup;
import com.moonkage.vendor.cakeattribute.CakeAttributeRef;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.vendor.SupplySource;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;

/** The rules a product's details keep by themselves (AC-29.1, AC-29.2, AC-29.4, BR-12, BR-34). */
class ProductDetailsTest {

    private static final String BUSINESS_NAME = "Tiệm bánh Trăng";
    private static final String NAME = "Hộp 4 bánh";
    private static final LocalDate EXPIRY_DATE = LocalDate.of(2026, 12, 31);
    private static final CakeAttributeRef CRUST =
            new CakeAttributeRef("c1", CakeAttributeGroup.CRUST, CakeAttributeCode.of("banh-nuong"));
    private static final CakeAttributeRef FILLING =
            new CakeAttributeRef("f1", CakeAttributeGroup.FILLING, CakeAttributeCode.of("dau-xanh"));

    @Test
    void anEmptyBrandIsTheBusinessNameOfAShopThatMakesItsCakes() {
        ProductDetails details = new Draft().brand("  ").build();

        assertEquals(BUSINESS_NAME, details.brand());
        assertFalse(details.resold());
        assertNull(details.origin());
    }

    @Test
    void aResoldProductNeedsItsBrandAndOrigin() {
        Draft resold = new Draft().supplySource(SupplySource.RESELL);
        assertField("brand", ErrorCode.RESALE_TERM_REQUIRED, resold.origin("Hà Nội"));
        assertField(
                "origin",
                ErrorCode.RESALE_TERM_REQUIRED,
                resold.brand("Kinh Đô").origin(" "));

        ProductDetails details = resold.brand(" Kinh Đô ").origin("Hà Nội").build();
        assertTrue(details.resold());
        assertEquals("Kinh Đô", details.brand());
    }

    @Test
    void theSupplySourceDecidesWhetherAProductIsResold() {
        assertField("resold", ErrorCode.FIELD_REQUIRED, new Draft().supplySource(SupplySource.BOTH));
        assertField("resold", ErrorCode.RESOLD_NOT_ALLOWED, new Draft().resold(true));
        assertField(
                "resold",
                ErrorCode.RESOLD_NOT_ALLOWED,
                new Draft().supplySource(SupplySource.RESELL).resold(false));

        Draft both = new Draft().supplySource(SupplySource.BOTH);
        assertTrue(both.resold(true).brand("B").origin("HN").build().resold());
        assertFalse(both.resold(false).build().resold());
    }

    @Test
    void aProductHasOneToTenDistinctImages() {
        assertField("imageKeys", ErrorCode.PRODUCT_IMAGE_COUNT_INVALID, new Draft().imageKeys(List.of()));
        assertField("imageKeys", ErrorCode.PRODUCT_IMAGE_COUNT_INVALID, new Draft().imageKeys(List.of("a", "a")));
        assertField(
                "imageKeys",
                ErrorCode.PRODUCT_IMAGE_COUNT_INVALID,
                new Draft().imageKeys(Collections.nCopies(ProductConstant.MAX_IMAGES + 1, "a")));

        assertEquals(
                List.of("b", "a"),
                new Draft().imageKeys(List.of("b", "a")).build().imageKeys());
    }

    @Test
    void aProductNeedsACrustAndAFilling() {
        assertField("crustCodes", ErrorCode.FIELD_REQUIRED, new Draft().crusts(List.of()));
        assertField("fillingCodes", ErrorCode.FIELD_REQUIRED, new Draft().fillings(null));
    }

    @Test
    void requiredFieldsAndLimitsNameTheirField() {
        assertField("name", ErrorCode.FIELD_REQUIRED, new Draft().name(" "));
        assertField("name", ErrorCode.TEXT_TOO_LONG, new Draft().name("x".repeat(ProductConstant.TEXT_MAX_LENGTH + 1)));
        assertField("stock", ErrorCode.STOCK_INVALID, new Draft().stock(-1));
        assertField("stock", ErrorCode.FIELD_REQUIRED, new Draft().stock(null));
        assertField("expiryDate", ErrorCode.FIELD_REQUIRED, new Draft().expiryDate(null));

        assertEquals(0, new Draft().stock(0).build().stock());
    }

    private static void assertField(String field, ErrorCode code, Draft draft) {
        AppException e = assertThrows(AppException.class, draft::build);
        assertEquals(code, e.getErrorCode());
        assertEquals(field, e.getField());
    }

    /** A valid product of a self-producing Shop, one field changed per call. */
    private static final class Draft {

        private SupplySource supplySource = SupplySource.SELF_PRODUCED;
        private Boolean resold;
        private String name = NAME;
        private String brand;
        private String origin;
        private Integer stock = 10;
        private LocalDate expiryDate = EXPIRY_DATE;
        private List<String> imageKeys = List.of("k1");
        private List<CakeAttributeRef> crusts = List.of(CRUST);
        private List<CakeAttributeRef> fillings = List.of(FILLING);

        Draft supplySource(SupplySource value) {
            supplySource = value;
            return this;
        }

        Draft resold(Boolean value) {
            resold = value;
            return this;
        }

        Draft name(String value) {
            name = value;
            return this;
        }

        Draft brand(String value) {
            brand = value;
            return this;
        }

        Draft origin(String value) {
            origin = value;
            return this;
        }

        Draft stock(Integer value) {
            stock = value;
            return this;
        }

        Draft expiryDate(LocalDate value) {
            expiryDate = value;
            return this;
        }

        Draft imageKeys(List<String> value) {
            imageKeys = value;
            return this;
        }

        Draft crusts(List<CakeAttributeRef> value) {
            crusts = value;
            return this;
        }

        Draft fillings(List<CakeAttributeRef> value) {
            fillings = value;
            return this;
        }

        ProductDetails build() {
            return ProductDetails.of(
                    supplySource,
                    BUSINESS_NAME,
                    resold,
                    name,
                    "Bánh nướng nhân đậu xanh",
                    brand,
                    origin,
                    null,
                    new Price(100_000),
                    stock,
                    expiryDate,
                    DeliveryLabel.LOCAL,
                    null,
                    null,
                    imageKeys,
                    crusts,
                    fillings);
        }
    }
}
