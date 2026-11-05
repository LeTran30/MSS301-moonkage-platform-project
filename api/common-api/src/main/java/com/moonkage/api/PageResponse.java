package com.moonkage.api;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * The stable JSON of a paged result (Spring's own {@code PageImpl} JSON is not a stable contract).
 *
 * <p>{@link #from(Page)} is the only way to build one, so every service answers a page in the same shape.
 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
