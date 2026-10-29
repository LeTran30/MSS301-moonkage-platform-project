package com.moonkage.identity.platform.web.validation;

import java.util.List;

/** Every field of one request that {@link FieldParser} refused; answered as 400 {@code COMMON_400} with errors[]. */
public final class InvalidFields extends RuntimeException {

    private static final long serialVersionUID = 1L;

    @SuppressWarnings("serial")
    private final List<FieldParser.FieldRejection> rejections;

    InvalidFields(List<FieldParser.FieldRejection> rejections) {
        super(rejections.size() + " invalid field(s)", null, false, false);
        this.rejections = List.copyOf(rejections);
    }

    public List<FieldParser.FieldRejection> rejections() {
        return rejections;
    }
}
