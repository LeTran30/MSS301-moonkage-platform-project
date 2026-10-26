package com.moonkage.catalog.repository;

import com.moonkage.catalog.entity.projection.ReviewProjectionRow;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JdbcProductReviewReadRepository implements ProductReviewReadRepository {
    private final JdbcTemplate jdbc;

    @Override
    public List<ReviewProjectionRow> findReviews(String productId, int limit, long offset) {
        return jdbc.query(
                """
                SELECT * FROM product_reviews WHERE product_id=? ORDER BY created_at DESC, review_id LIMIT ? OFFSET ?
                """,
                (row, index) -> new ReviewProjectionRow(
                        row.getString("review_id"),
                        row.getString("product_id"),
                        row.getString("vendor_id"),
                        row.getInt("rating"),
                        row.getString("content"),
                        row.getTimestamp("created_at").toInstant()),
                productId,
                limit,
                offset);
    }

    @Override
    public long countReviews(String productId) {
        Long count =
                jdbc.queryForObject("SELECT count(*) FROM product_reviews WHERE product_id=?", Long.class, productId);
        return count == null ? 0 : count;
    }
}
