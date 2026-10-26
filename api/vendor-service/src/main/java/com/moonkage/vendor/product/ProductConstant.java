package com.moonkage.vendor.product;

/** Limits of a product's fields, shared by the request checks and the product's own rules. */
public final class ProductConstant {

    /** products.name, brand, origin are varchar(255). */
    public static final int TEXT_MAX_LENGTH = 255;

    public static final int DESCRIPTION_MAX_LENGTH = 5000;

    /** Images per product, the first one shown in lists. */
    public static final int MAX_IMAGES = 10;

    /** Crusts, and fillings, a product may list; the catalogue is far smaller. */
    public static final int MAX_CAKE_ATTRIBUTES = 50;

    private ProductConstant() {}
}
