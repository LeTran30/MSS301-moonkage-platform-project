package com.moonkage.catalog.entity.projection;

public final class ProjectionRowValidation {
    private static final int ID_LENGTH = 36;

    private ProjectionRowValidation() {}

    public static void requireId(String id) {
        if (id == null || id.isBlank() || id.length() > ID_LENGTH) {
            throw new IllegalArgumentException("Invalid projection identity");
        }
    }
}
