package com.moonkage.vendor.cakeattribute;

/** A value of the catalogue as other components link it: by id in their tables, by code in events (L-19). */
public record CakeAttributeRef(String id, CakeAttributeGroup group, CakeAttributeCode code) {}
