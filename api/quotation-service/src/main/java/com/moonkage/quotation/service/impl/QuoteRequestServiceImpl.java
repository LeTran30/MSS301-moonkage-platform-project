package com.moonkage.quotation.service.impl;

import com.moonkage.quotation.client.IdentityClient;
import com.moonkage.quotation.common.Roles;
import com.moonkage.quotation.common.TimeConstant;
import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.dto.event.RequestCreatedEvent;
import com.moonkage.quotation.dto.event.RequestDeclinedEvent;
import com.moonkage.quotation.dto.request.CreateQuoteRequestRequest;
import com.moonkage.quotation.dto.request.DeliveryAddressRequest;
import com.moonkage.quotation.dto.request.UpdateInvitationRequest;
import com.moonkage.quotation.dto.response.InvitationResponse;
import com.moonkage.quotation.dto.response.QuoteRequestResponse;
import com.moonkage.quotation.entity.Quote;
import com.moonkage.quotation.entity.QuoteRequest;
import com.moonkage.quotation.entity.RequestInvitation;
import com.moonkage.quotation.entity.VendorSnapshot;
import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.enums.InvitationStatus;
import com.moonkage.quotation.enums.RequestType;
import com.moonkage.quotation.mapper.QuoteRequestMapper;
import com.moonkage.quotation.repository.QuoteRepository;
import com.moonkage.quotation.repository.QuoteRequestRepository;
import com.moonkage.quotation.repository.RequestInvitationRepository;
import com.moonkage.quotation.repository.VendorSnapshotRepository;
import com.moonkage.quotation.service.OutboxService;
import com.moonkage.quotation.service.QuoteRequestService;
import com.moonkage.quotation.service.impl.RequestAccessPolicy.Viewer;
import com.moonkage.reference.Province;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FR-15, FR-16, FR-36. Server-side rules: the buyer has verified NFC (BR-23) and never deals with a vendor they own
 * (BR-22); a direct request respects the vendor's minimum and custom work (BR-16); an open request invites exactly the
 * vendors that take orders, meet the quantity, make the custom work and deliver to the province (BR-16, BR-20, BR-31).
 */
@Service
@RequiredArgsConstructor
public class QuoteRequestServiceImpl implements QuoteRequestService {

    private final QuoteRequestRepository quoteRequestRepository;
    private final RequestInvitationRepository requestInvitationRepository;
    private final QuoteRepository quoteRepository;
    private final VendorSnapshotRepository vendorSnapshotRepository;
    private final VendorDirectory vendorDirectory;
    private final RequestAccessPolicy requestAccessPolicy;
    private final IdentityClient identityClient;
    private final OutboxService outboxService;
    private final Clock clock;

    @Override
    @Transactional
    public QuoteRequestResponse create(String accountId, CreateQuoteRequestRequest body) {
        Set<CustomType> customTypes =
                body.customTypes() == null || body.customTypes().isEmpty()
                        ? EnumSet.noneOf(CustomType.class)
                        : EnumSet.copyOf(body.customTypes());
        validateDelivery(body.delivery(), body.deliveryDeadline());
        requireVerifiedNfc(accountId);

        List<String> invitedVendorIds = body.type() == RequestType.DIRECT
                ? List.of(checkDirectTarget(accountId, body, customTypes).getVendorId())
                : matchOpenRequest(accountId, body, customTypes);

        QuoteRequest request = QuoteRequest.open(
                accountId,
                body.type(),
                body.type() == RequestType.DIRECT ? body.targetVendorId() : null,
                body.productId(),
                body.quantity(),
                body.budget(),
                body.deliveryDeadline());
        DeliveryAddressRequest delivery = body.delivery();
        request.deliverTo(
                delivery.recipientName().strip(),
                delivery.recipientPhone(),
                delivery.provinceCode(),
                delivery.addressDetail().strip());
        request.customize(customTypes, body.customSpec());

        QuoteRequest saved = quoteRequestRepository.saveAndFlush(request);
        requestInvitationRepository.saveAll(invitedVendorIds.stream()
                .map(vendorId -> RequestInvitation.of(saved.getId(), vendorId))
                .toList());
        String eventId = UUID.randomUUID().toString();
        outboxService.enqueue(
                eventId,
                RequestCreatedEvent.ROUTING_KEY,
                new RequestCreatedEvent(
                        eventId, clock.instant(), saved.getId(), accountId, saved.getType(), invitedVendorIds));

        return QuoteRequestMapper.toResponse(saved, invitedVendorIds.size(), 0, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuoteRequestResponse> searchRequests(String accountId, String role, String vendorId) {
        if (vendorId == null) {
            List<QuoteRequest> requests = Roles.isAdmin(role)
                    ? quoteRequestRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                    : quoteRequestRepository.findByBuyerAccountIdOrderByCreatedAtDesc(accountId);
            return toResponses(requests, null);
        }
        VendorSnapshot vendor = Roles.isAdmin(role)
                ? vendorDirectory.getVendor(vendorId)
                : vendorDirectory.getOwned(accountId, vendorId);
        return toResponses(quoteRequestRepository.findInvitingVendor(vendorId), vendor);
    }

    @Override
    @Transactional(readOnly = true)
    public QuoteRequestResponse getRequest(String accountId, String role, String requestId) {
        QuoteRequest request = requestAccessPolicy.getRequest(requestId);
        Viewer viewer = requestAccessPolicy.viewerOf(accountId, role, request);

        VendorSnapshot vendor = viewer.isVendor() ? vendorDirectory.getVendor(viewer.vendorId()) : null;
        return toResponses(List.of(request), vendor).get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvitationResponse> getInvitations(String accountId, String role, String requestId) {
        QuoteRequest request = requestAccessPolicy.getRequest(requestId);
        Viewer viewer = requestAccessPolicy.viewerOf(accountId, role, request);

        List<RequestInvitation> invitations =
                requestInvitationRepository.findByRequestIdOrderByCreatedAtAsc(requestId).stream()
                        .filter(i -> viewer.canSeeVendor(i.getVendorId()))
                        .toList();
        Map<String, String> names = vendorDirectory.namesOf(
                invitations.stream().map(RequestInvitation::getVendorId).toList());
        return invitations.stream()
                .map(i -> QuoteRequestMapper.toInvitationResponse(i, names.get(i.getVendorId())))
                .toList();
    }

    /** AC-36.3: the only change a vendor makes to its invitation is declining it, with a reason. */
    @Override
    @Transactional
    public InvitationResponse updateInvitation(
            String accountId, String requestId, String vendorId, UpdateInvitationRequest body) {
        if (body.status() != InvitationStatus.DECLINED) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION, body.status());
        }
        VendorSnapshot vendor = vendorDirectory.getOwned(accountId, vendorId);
        QuoteRequest request = requestAccessPolicy.lockRequest(requestId);
        if (!request.isOpen()) {
            throw new AppException(ErrorCode.REQUEST_NOT_OPEN);
        }
        RequestInvitation invitation = requestInvitationRepository
                .findByRequestIdAndVendorId(requestId, vendorId)
                .orElseThrow(() -> new AppException(ErrorCode.INVITATION_NOT_FOUND));

        Instant now = clock.instant();
        invitation.decline(body.declineReason(), now);

        String eventId = UUID.randomUUID().toString();
        outboxService.enqueue(
                eventId,
                RequestDeclinedEvent.ROUTING_KEY,
                new RequestDeclinedEvent(
                        eventId, now, requestId, request.getBuyerAccountId(), vendorId, invitation.getDeclineReason()));

        return QuoteRequestMapper.toInvitationResponse(invitation, vendor.getBusinessName());
    }

    private void validateDelivery(DeliveryAddressRequest delivery, LocalDate deadline) {
        if (!Province.isKnown(delivery.provinceCode())) {
            throw new AppException(ErrorCode.INVALID_PROVINCE, delivery.provinceCode());
        }
        LocalDate today = LocalDate.now(clock.withZone(TimeConstant.VIETNAM_ZONE));
        if (!deadline.isAfter(today)) {
            throw new AppException(ErrorCode.DELIVERY_DEADLINE_PASSED);
        }
    }

    /** BR-23, checked by the server whatever the screen showed (AC-15.5, AC-16.5). */
    private void requireVerifiedNfc(String accountId) {
        if (!identityClient.getNfcStatus(accountId).isVerified()) {
            throw new AppException(ErrorCode.NFC_NOT_VERIFIED);
        }
    }

    /** FR-15: AC-15.2 (minimum), AC-15.4 (BR-22), locked or unpaid vendor (BR-20, BR-31). */
    private VendorSnapshot checkDirectTarget(
            String accountId, CreateQuoteRequestRequest body, Set<CustomType> customTypes) {
        if (body.targetVendorId() == null || body.targetVendorId().isBlank()) {
            throw new AppException(ErrorCode.TARGET_VENDOR_REQUIRED);
        }
        VendorSnapshot vendor = vendorDirectory.getVendor(body.targetVendorId());
        if (vendor.isOwnedBy(accountId)) {
            throw new AppException(ErrorCode.SELF_DEALING);
        }
        if (!vendor.isTakingOrders()) {
            throw new AppException(ErrorCode.VENDOR_NOT_ACCEPTING_ORDERS);
        }
        if (!vendor.meetsMinQty(body.quantity())) {
            throw new AppException(ErrorCode.BELOW_MIN_QUANTITY, vendor.getMinQty());
        }
        customTypes.stream()
                .filter(t -> !vendor.canMake(EnumSet.of(t)))
                .findFirst()
                .ifPresent(t -> {
                    throw new AppException(ErrorCode.CUSTOM_NOT_SUPPORTED, t);
                });
        return vendor;
    }

    /** BR-16 and AC-16.4: the owner's own vendor is never invited, even when it matches. */
    private List<String> matchOpenRequest(
            String accountId, CreateQuoteRequestRequest body, Set<CustomType> customTypes) {
        List<String> vendorIds =
                vendorSnapshotRepository.findByAcceptsOrdersTrueAndCanOperateTrueOrderByBusinessNameAsc().stream()
                        .filter(v -> !v.isOwnedBy(accountId))
                        .filter(v -> v.meetsMinQty(body.quantity()))
                        .filter(v -> v.canMake(customTypes))
                        .filter(v -> v.deliversTo(body.delivery().provinceCode()))
                        .map(VendorSnapshot::getVendorId)
                        .toList();
        if (vendorIds.isEmpty()) {
            throw new AppException(ErrorCode.NO_MATCHING_VENDOR);
        }
        return vendorIds;
    }

    /** @param vendorViewer the vendor looking, for its suggested price (AC-38.2); null for buyer and admin */
    private List<QuoteRequestResponse> toResponses(List<QuoteRequest> requests, VendorSnapshot vendorViewer) {
        if (requests.isEmpty()) {
            return List.of();
        }
        List<String> ids = requests.stream().map(QuoteRequest::getId).toList();
        Map<String, Long> invitedCounts = requestInvitationRepository.findByRequestIdIn(ids).stream()
                .collect(Collectors.groupingBy(RequestInvitation::getRequestId, Collectors.counting()));
        Map<String, List<Quote>> quotesByRequest =
                quoteRepository.findByRequestIdIn(ids).stream().collect(Collectors.groupingBy(Quote::getRequestId));
        return requests.stream()
                .map(r -> QuoteRequestMapper.toResponse(
                        r,
                        invitedCounts.getOrDefault(r.getId(), 0L).intValue(),
                        Revisions.countLive(quotesByRequest.getOrDefault(r.getId(), List.of())),
                        vendorViewer == null
                                ? null
                                : vendorDirectory.suggestedUnitPrice(vendorViewer, r.getQuantity())))
                .toList();
    }
}
