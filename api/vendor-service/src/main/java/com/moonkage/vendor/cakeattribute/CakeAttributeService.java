package com.moonkage.vendor.cakeattribute;

import com.moonkage.vendor.cakeattribute.dto.CakeAttributeResponse;
import com.moonkage.vendor.cakeattribute.dto.CreateCakeAttributeRequest;
import com.moonkage.vendor.cakeattribute.dto.UpdateCakeAttributeRequest;
import com.moonkage.vendor.security.CurrentUserInfo;
import java.util.Collection;
import java.util.List;

/** The catalogue of crusts and fillings (FR-54, BR-34). */
public interface CakeAttributeService {

    /**
     * Visible values for anyone, guests included (AC-06.6, AC-29.1); hidden ones too for an admin. In the admin's
     * order, group by group.
     *
     * @param caller null for a guest
     * @param group null for both groups
     */
    List<CakeAttributeResponse> getCakeAttributes(
            CurrentUserInfo caller, CakeAttributeGroup group, boolean includeHidden);

    /**
     * The values named by {@code codes}, hidden ones included, for anyone: a product keeps showing a value hidden
     * after it was linked (AC-07.1, AC-54.4). Not a picker: it returns only what is asked. A code that names no
     * value, or is not a code, is left out. In the admin's order.
     *
     * @param group null for both groups ("khac" exists in each)
     */
    List<CakeAttributeResponse> getByCodes(CakeAttributeGroup group, Collection<String> codes);

    /** Admin only (AC-54.1, AC-54.2). */
    CakeAttributeResponse createCakeAttribute(CurrentUserInfo caller, CreateCakeAttributeRequest request);

    /** Admin only (AC-54.3 → AC-54.6). */
    CakeAttributeResponse updateCakeAttribute(
            CurrentUserInfo caller, String attributeId, UpdateCakeAttributeRequest request);

    /**
     * The values of {@code group} named by {@code codes}, for something that already links {@code linkedIds}: each
     * must be visible, or hidden and already linked (AC-29.1, AC-33.6). Repeated codes count once.
     *
     * @throws com.moonkage.vendor.common.exception.AppException CAKE_ATTRIBUTE_NOT_SELECTABLE naming the first code
     *     that is not
     */
    List<CakeAttributeRef> select(CakeAttributeGroup group, Collection<String> codes, Collection<String> linkedIds);

    /** The values with these ids, in the admin's order; an unknown id is left out. */
    List<CakeAttributeRef> getRefs(Collection<String> attributeIds);
}
