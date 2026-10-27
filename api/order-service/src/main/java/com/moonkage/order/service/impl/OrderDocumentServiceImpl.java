package com.moonkage.order.service.impl;

import com.moonkage.order.config.RabbitConfig;
import com.moonkage.order.dto.event.OrderActivityEvent;
import com.moonkage.order.dto.request.AttachFileRequest;
import com.moonkage.order.dto.request.FileUploadRequest;
import com.moonkage.order.dto.request.ReviewMockupRequest;
import com.moonkage.order.dto.response.FileLinkResponse;
import com.moonkage.order.dto.response.MockupResponse;
import com.moonkage.order.dto.response.PresignedUploadLinkResponse;
import com.moonkage.order.entity.MockupVersion;
import com.moonkage.order.entity.Order;
import com.moonkage.order.enums.MockupReviewStatus;
import com.moonkage.order.enums.OrderKind;
import com.moonkage.order.enums.OrderStatus;
import com.moonkage.order.exception.AppException;
import com.moonkage.order.exception.ErrorCode;
import com.moonkage.order.repository.MockupVersionRepository;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.OrderAccess;
import com.moonkage.order.service.OrderDocumentService;
import com.moonkage.order.service.OrderEventPublisher;
import com.moonkage.order.service.OrderFileService;
import com.moonkage.order.service.OrderProgress;
import com.moonkage.order.service.OutboxService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class OrderDocumentServiceImpl implements OrderDocumentService {

    private final MockupVersionRepository mockupVersionRepository;
    private final OrderAccess orderAccess;
    private final OrderFileService fileService;
    private final OrderProgress orderProgress;
    private final OrderEventPublisher orderEvents;
    private final OutboxService outboxService;

    @Override
    public PresignedUploadLinkResponse createUploadLink(FileUploadRequest request) {
        return fileService.createUploadLink(request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MockupResponse> mockups(CurrentUserInfo caller, String orderId) {
        orderAccess.readable(caller, orderId);
        return mockupVersionRepository.findByOrderIdOrderByVersionNoAsc(orderId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public MockupResponse uploadMockup(CurrentUserInfo caller, String orderId, AttachFileRequest request) {
        Order order = orderAccess.forVendor(caller, orderId);
        if (order.getKind() != OrderKind.CUSTOM_ORDER || !order.isHasCustom()) {
            throw new AppException(ErrorCode.NO_CUSTOM_WORK);
        }
        if (order.getStatus() != OrderStatus.DEPOSITED && order.getStatus() != OrderStatus.AWAITING_MOCKUP_APPROVAL) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        MockupVersion version = new MockupVersion();
        version.setOrder(order);
        version.setVersionNo((int) mockupVersionRepository.countByOrderId(orderId) + 1);
        version.setObjectKey(fileService.attach(orderId, request.tempKey()));
        mockupVersionRepository.save(version);
        if (order.getStatus() == OrderStatus.DEPOSITED) {
            orderProgress.moveTo(order, OrderStatus.AWAITING_MOCKUP_APPROVAL, null, List.of());
            orderEvents.announce(RabbitConfig.ORDER_STATUS_CHANGED_ROUTING_KEY, order);
        }
        announce(RabbitConfig.MOCKUP_UPLOADED_ROUTING_KEY, order, version);
        return toResponse(version);
    }

    @Override
    @Transactional
    public MockupResponse reviewMockup(
            CurrentUserInfo caller, String orderId, int versionNo, ReviewMockupRequest request) {
        Order order = orderAccess.forBuyer(caller, orderId);
        MockupVersion version = mockupVersionRepository
                .findByOrderIdAndVersionNo(orderId, versionNo)
                .orElseThrow(() -> new AppException(ErrorCode.MOCKUP_NOT_FOUND));
        if (version.getReviewStatus() != MockupReviewStatus.PENDING_REVIEW
                || request.reviewStatus() == MockupReviewStatus.PENDING_REVIEW) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        if (request.reviewStatus() == MockupReviewStatus.CHANGES_REQUESTED
                && !StringUtils.hasText(request.reviewNote())) {
            throw new AppException(ErrorCode.REVIEW_NOTE_REQUIRED);
        }
        version.setReviewStatus(request.reviewStatus());
        version.setReviewNote(
                StringUtils.hasText(request.reviewNote()) ? request.reviewNote().trim() : null);
        version.setReviewedAt(Instant.now());
        announce(RabbitConfig.MOCKUP_REVIEWED_ROUTING_KEY, order, version);
        return toResponse(version);
    }

    @Override
    @Transactional(readOnly = true)
    public FileLinkResponse invoice(CurrentUserInfo caller, String orderId) {
        Order order = orderAccess.readable(caller, orderId);
        if (order.getInvoiceObjectKey() == null) {
            throw new AppException(ErrorCode.INVOICE_NOT_ATTACHED);
        }
        return new FileLinkResponse(fileService.downloadUrl(order.getInvoiceObjectKey()));
    }

    @Override
    @Transactional
    public FileLinkResponse attachInvoice(CurrentUserInfo caller, String orderId, AttachFileRequest request) {
        Order order = orderAccess.forVendor(caller, orderId);
        order.setInvoiceObjectKey(fileService.attach(orderId, request.tempKey()));
        OrderActivityEvent event = new OrderActivityEvent(
                UUID.randomUUID().toString(),
                orderId,
                order.getVendorId(),
                order.getBuyerAccountId(),
                null,
                null,
                Instant.now());
        outboxService.enqueue(event.eventId(), RabbitConfig.INVOICE_ATTACHED_ROUTING_KEY, event);
        return new FileLinkResponse(fileService.downloadUrl(order.getInvoiceObjectKey()));
    }

    private void announce(String routingKey, Order order, MockupVersion version) {
        OrderActivityEvent event = new OrderActivityEvent(
                UUID.randomUUID().toString(),
                order.getId(),
                order.getVendorId(),
                order.getBuyerAccountId(),
                version.getVersionNo(),
                version.getReviewStatus().name(),
                Instant.now());
        outboxService.enqueue(event.eventId(), routingKey, event);
    }

    private MockupResponse toResponse(MockupVersion version) {
        return new MockupResponse(
                version.getVersionNo(),
                fileService.downloadUrl(version.getObjectKey()),
                version.getReviewStatus(),
                version.getReviewNote(),
                version.getUploadedAt(),
                version.getReviewedAt());
    }
}
