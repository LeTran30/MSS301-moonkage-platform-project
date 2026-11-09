package com.moonkage.vendor.vendor;

/** A vendor locked for a change of its selling settings: what those settings depend on. */
public record EditableVendor(String id, boolean acceptsOrders, SupplySource supplySource) {}
