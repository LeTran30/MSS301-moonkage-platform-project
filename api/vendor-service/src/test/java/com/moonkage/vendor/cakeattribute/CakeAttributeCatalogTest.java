package com.moonkage.vendor.cakeattribute;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/** The rules across the values of one group (AC-54.1, AC-54.2, AC-54.5), without a database. */
class CakeAttributeCatalogTest {

    private final CakeAttribute baked = saved("1", "Bánh nướng", 1);
    private final CakeAttribute snowSkin = saved("2", "Bánh dẻo", 2);
    private final CakeAttributeCatalog catalog =
            new CakeAttributeCatalog(CakeAttributeGroup.CRUST, List.of(baked, snowSkin));

    @Test
    void aNewValueIsVisibleAndLast() {
        CakeAttribute added = catalog.add(CakeAttributeLabel.of("Bánh lạnh"));

        assertEquals("banh-lanh", added.getCode().value());
        assertEquals("banh lanh", added.getLabelKey());
        assertEquals(3, added.getSortOrder());
        assertTrue(added.isActive());
    }

    @Test
    void aLabelOrACodeAlreadyInTheGroupIsADuplicateNamingTheValueThere() {
        AppException sameKey =
                assertThrows(AppException.class, () -> catalog.add(CakeAttributeLabel.of("banh  NUONG")));
        assertEquals(ErrorCode.CAKE_ATTRIBUTE_DUPLICATE, sameKey.getErrorCode());
        assertEquals("Bánh nướng", sameKey.getArgs()[0]);

        // a different key that builds the same code
        AppException sameCode =
                assertThrows(AppException.class, () -> catalog.add(CakeAttributeLabel.of("Bánh-nướng")));
        assertEquals(ErrorCode.CAKE_ATTRIBUTE_DUPLICATE, sameCode.getErrorCode());
    }

    @Test
    void aRenameKeepsTheCodeAndMayChangeOnlyTheValueOwnSpelling() {
        catalog.rename(baked, CakeAttributeLabel.of("BÁNH NƯỚNG"));
        assertEquals("BÁNH NƯỚNG", baked.getLabel().value());
        assertEquals("banh-nuong", baked.getCode().value());

        catalog.rename(baked, CakeAttributeLabel.of("Bánh nướng truyền thống"));
        assertEquals("banh-nuong", baked.getCode().value());

        assertThrows(AppException.class, () -> catalog.rename(baked, CakeAttributeLabel.of("Bánh dẻo")));
    }

    @Test
    void theLastVisibleValueOfAGroupStaysVisible() {
        catalog.hide(baked);
        assertFalse(baked.isActive());

        AppException e = assertThrows(AppException.class, () -> catalog.hide(snowSkin));
        assertEquals(ErrorCode.LAST_VISIBLE_CAKE_ATTRIBUTE, e.getErrorCode());
        assertTrue(snowSkin.isActive());

        // hiding one already hidden changes nothing and is allowed
        catalog.hide(baked);
    }

    @Test
    void aHiddenValueIsSelectableOnlyWhereItIsAlreadyLinked() {
        catalog.hide(baked);

        assertFalse(baked.isSelectableBy(Set.of()));
        assertTrue(baked.isSelectableBy(Set.of("1")));
        assertTrue(snowSkin.isSelectableBy(Set.of()));
    }

    @Test
    void aPositionIsZeroOrMore() {
        AppException e = assertThrows(AppException.class, () -> baked.reorder(-1));
        assertEquals(ErrorCode.SORT_ORDER_INVALID, e.getErrorCode());
    }

    private static CakeAttribute saved(String id, String label, int sortOrder) {
        CakeAttribute value = CakeAttribute.create(CakeAttributeGroup.CRUST, CakeAttributeLabel.of(label), sortOrder);
        ReflectionTestUtils.setField(value, "id", id);
        return value;
    }
}
