package com.moonkage.vendor.product;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.vendor.cakeattribute.CakeAttributeCode;
import com.moonkage.vendor.cakeattribute.CakeAttributeGroup;
import com.moonkage.vendor.cakeattribute.CakeAttributeRef;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Price;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class ProductExpiryTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 13);
    private static final CakeAttributeRef CRUST =
            new CakeAttributeRef("c1", CakeAttributeGroup.CRUST, CakeAttributeCode.of("banh-nuong"));
    private static final CakeAttributeRef FILLING =
            new CakeAttributeRef("f1", CakeAttributeGroup.FILLING, CakeAttributeCode.of("dau-xanh"));

    @Test
    void theProductMayBeCreatedAndReplacedThroughItsExpiryDate() {
        Product product = Product.create("vendor-1", details(TODAY), TODAY);

        product.replace(details(TODAY), TODAY);

        assertEquals(TODAY, product.getExpiryDate());
        assertEquals(ProductStatus.ON_SALE, product.getStatus());
    }

    @Test
    void aPastExpiryDateCannotBeCreatedOrUsedAsAReplacement() {
        AppException createError =
                assertThrows(AppException.class, () -> Product.create("vendor-1", details(TODAY.minusDays(1)), TODAY));
        assertExpiryError(createError);

        Product product = Product.create("vendor-1", details(TODAY.plusDays(1)), TODAY);
        AppException replaceError =
                assertThrows(AppException.class, () -> product.replace(details(TODAY.minusDays(1)), TODAY));
        assertExpiryError(replaceError);
        assertEquals(TODAY.plusDays(1), product.getExpiryDate());
    }

    @Test
    void anExpiredHiddenProductCannotReturnOnSale() {
        LocalDate expiryDate = TODAY.minusDays(1);
        Product product = Product.create("vendor-1", details(expiryDate), expiryDate);
        product.hide();

        AppException error = assertThrows(AppException.class, () -> product.show(TODAY));

        assertExpiryError(error);
        assertEquals(ProductStatus.HIDDEN, product.getStatus());
    }

    @Test
    void supplyAllowsThePrintedExpiryDateButNotTheFollowingDay() {
        Product product = Product.create("vendor-1", details(TODAY), TODAY);

        assertTrue(product.canSupply(1, TODAY));
        assertFalse(product.canSupply(1, TODAY.plusDays(1)));
        assertThrows(IllegalStateException.class, () -> product.takeStock(1, TODAY.plusDays(1)));
        assertEquals(10, product.getStock());
    }

    private static void assertExpiryError(AppException error) {
        assertEquals(ErrorCode.PRODUCT_EXPIRY_PASSED, error.getErrorCode());
        assertEquals(ProductDetails.EXPIRY_DATE, error.getField());
    }

    private static ProductDetails details(LocalDate expiryDate) {
        return ProductDetails.of(
                com.moonkage.vendor.vendor.SupplySource.SELF_PRODUCED,
                "Tiệm bánh Trăng",
                null,
                "Hộp 4 bánh",
                "Bánh nướng nhân đậu xanh",
                null,
                null,
                null,
                new Price(100_000),
                10,
                expiryDate,
                DeliveryLabel.LOCAL,
                null,
                null,
                List.of("products/a.jpg"),
                List.of(CRUST),
                List.of(FILLING));
    }
}
