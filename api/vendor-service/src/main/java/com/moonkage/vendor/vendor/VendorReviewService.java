package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.config.RabbitConfig;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.outbox.OutboxService;
import com.moonkage.vendor.vendor.dto.request.CreateVendorReviewRequest;
import com.moonkage.vendor.vendor.dto.response.VendorReviewResponse;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * An admin's decision on a vendor profile: what the admin had to confirm before deciding (AC-45.2, AC-45.5), the
 * review row that keeps that decision, and the vendor.reviewed event the other services hear about (AC-45.3).
 *
 * <p>Split out of {@link VendorServiceImpl} because the review rules are a decision of their own: they change with
 * the review policy (AC-45), not with the profile submission or the documents.
 */
@Component
@RequiredArgsConstructor
class VendorReviewService {

    // request fields named in errors, so the client shows each error at its field (FR-26)
    private static final String FIELD_REASON = "reason";
    private static final String FIELD_LICENSE_CHECKED = "licenseChecked";
    private static final String FIELD_REGISTRY_CHECKED = "registryChecked";

    private final VendorReviewRepository reviewRepository;
    private final VendorSnapshotPublisher snapshotPublisher;
    private final OutboxService outboxService;

    /** Decides the profile, keeps the decision and announces it (AC-45.2 → AC-45.5). */
    VendorReviewResponse decide(Vendor vendor, String adminAccountId, CreateVendorReviewRequest request) {
        String reason = StringUtils.hasText(request.reason()) ? request.reason().trim() : null;
        checkReview(vendor, request, reason);

        vendor.decide(request.decision(), request.decision().requiresReason() ? reason : null);
        VendorReview review = reviewRepository.saveAndFlush(VendorReview.of(
                vendor.getId(),
                adminAccountId,
                request.decision(),
                reason,
                request.licenseChecked(),
                request.registryChecked()));
        VendorReviewedEvent event = VendorReviewedEvent.of(vendor, review, review.getDecidedAt());
        outboxService.enqueue(event.eventId(), RabbitConfig.VENDOR_REVIEWED_ROUTING_KEY, event);
        snapshotPublisher.announceUpdated(vendor, adminAccountId);
        return VendorMapper.toReviewResponse(review);
    }

    /** AC-45.2 and AC-45.5, before the vendor's status is touched. */
    private static void checkReview(Vendor vendor, CreateVendorReviewRequest request, String reason) {
        if (request.decision().requiresReason() && reason == null) {
            throw new AppException(ErrorCode.REVIEW_REASON_REQUIRED).atField(FIELD_REASON);
        }
        if (request.decision() != ReviewDecision.APPROVE) {
            return;
        }
        List<String> missing = new ArrayList<>();
        if (!request.licenseChecked()) {
            missing.add(FIELD_LICENSE_CHECKED);
        }
        // A-14: only enterprises have a code on the national business registration portal
        if (vendor.getEntityType() == VendorEntityType.SOLE_PROPRIETORSHIP && !request.registryChecked()) {
            missing.add(FIELD_REGISTRY_CHECKED);
        }
        if (!missing.isEmpty()) {
            throw new AppException(ErrorCode.REVIEW_CONFIRMATION_REQUIRED, String.join(", ", missing));
        }
    }
}
