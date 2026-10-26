package com.moonkage.order.service.impl;

import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.ReviewCreatedEvent;
import com.moonkage.order.dto.request.CreateReviewRequest;
import com.moonkage.order.dto.response.ReviewResponse;
import com.moonkage.order.entity.Order;
import com.moonkage.order.entity.Review;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.OrderItemRepository;
import com.moonkage.order.repository.ReviewRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.OrderAccess;
import com.moonkage.order.service.OutboxService;
import com.moonkage.order.service.ReviewService;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderAccess orderAccess;
    private final OutboxService outboxService;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public ReviewResponse create(CurrentUserInfo caller, String orderId, CreateReviewRequest request) {
        Order order = orderAccess.forBuyer(caller, orderId);
        boolean delivered = order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.COMPLETED;
        boolean inOrder = orderItemRepository.findByOrderId(orderId).stream()
                .anyMatch(item -> item.getProductId().equals(request.productId()));
        if (order.getKind() != OrderKind.BUY_NOW || !delivered || !inOrder) {
            throw new AppException(ErrorCode.REVIEW_NOT_ALLOWED);
        }
        if (reviewRepository.existsByOrderIdAndProductId(orderId, request.productId())) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }
        Review review = new Review();
        review.setOrderId(orderId);
        review.setProductId(request.productId());
        review.setVendorId(order.getVendorId());
        review.setBuyerAccountId(caller.accountId());
        review.setRating(request.rating());
        review.setContent(
                StringUtils.hasText(request.content()) ? request.content().trim() : null);
        reviewRepository.save(review);
        entityManager.flush();
        ReviewCreatedEvent event = new ReviewCreatedEvent(
                UUID.randomUUID().toString(),
                review.getId(),
                review.getProductId(),
                review.getVendorId(),
                orderId,
                review.getRating(),
                review.getContent(),
                Objects.requireNonNullElseGet(review.getCreatedAt(), Instant::now));
        outboxService.enqueue(event.eventId(), RabbitConfig.REVIEW_CREATED_ROUTING_KEY, event);
        return toResponse(review);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> list(CurrentUserInfo caller, String orderId) {
        orderAccess.readable(caller, orderId);
        return reviewRepository.findByOrderIdOrderByCreatedAtAsc(orderId).stream()
                .map(ReviewServiceImpl::toResponse)
                .toList();
    }

    private static ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(), review.getProductId(), review.getRating(), review.getContent(), review.getCreatedAt());
    }
}
