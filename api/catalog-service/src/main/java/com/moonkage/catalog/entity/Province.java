package com.moonkage.catalog.entity;

/** Reference row read through JDBC; no Hibernate mapping of the legacy product tables is needed. */
public record Province(String code, String name) {}
