package com.moonkage.vendor.cakeattribute.dto;

import com.moonkage.vendor.cakeattribute.CakeAttributeGroup;

/** One crust or filling of the catalogue (FR-54). */
public record CakeAttributeResponse(
        String id, CakeAttributeGroup group, String code, String label, int sortOrder, boolean active) {}
