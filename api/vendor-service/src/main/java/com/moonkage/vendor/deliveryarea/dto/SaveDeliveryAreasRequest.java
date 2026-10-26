package com.moonkage.vendor.deliveryarea.dto;

import java.util.List;

/** Replaces the whole list of provinces the vendor delivers to (FR-28). */
public record SaveDeliveryAreasRequest(List<String> provinceCodes) {}
