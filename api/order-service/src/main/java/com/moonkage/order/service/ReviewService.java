package com.moonkage.order.service;

import com.moonkage.order.dto.request.CreateReviewRequest;
import com.moonkage.order.dto.response.ReviewResponse;
import com.moonkage.order.security.CurrentUserInfo;
import java.util.List;

/** FR-11, BR-32: reviews of the products of a delivered buy-now order; catalog shows them (review.created). */
public interface ReviewService {

    ReviewResponse create(CurrentUserInfo caller, String orderId, CreateReviewRequest request);

    List<ReviewResponse> list(CurrentUserInfo caller, String orderId);
}
