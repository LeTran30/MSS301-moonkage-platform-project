package com.moonkage.quotation.service.impl;

import com.moonkage.quotation.common.TimeConstant;
import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.dto.event.QuoteSubmittedEvent;
import com.moonkage.quotation.dto.event.QuoteWithdrawnEvent;
import com.moonkage.quotation.dto.request.CustomItemRequest;
import com.moonkage.quotation.dto.request.QuoteItemRequest;
import com.moonkage.quotation.dto.request.SubmitQuoteRequest;
import com.moonkage.quotation.dto.request.UpdateQuoteRequest;
import com.moonkage.quotation.dto.response.QuoteResponse;
import com.moonkage.quotation.entity.Quote;
import com.moonkage.quotation.entity.QuoteItem;
import com.moonkage.quotation.entity.QuoteRequest;
import com.moonkage.quotation.entity.QuoteTerms;
import com.moonkage.quotation.entity.RequestInvitation;
import com.moonkage.quotation.entity.VendorSnapshot;
import com.moonkage.quotation.enums.AcceptanceStatus;
import com.moonkage.quotation.enums.QuoteStatus;
import com.moonkage.quotation.mapper.QuoteMapper;
import com.moonkage.quotation.repository.QuoteAcceptanceRepository;
import com.moonkage.quotation.repository.QuoteRepository;
import com.moonkage.quotation.repository.RequestInvitationRepository;
import com.moonkage.quotation.service.OutboxService;
import com.moonkage.quotation.service.QuoteService;
import com.moonkage.quotation.service.impl.RequestAccessPolicy.Viewer;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FR-38, FR-17, BR-05. A sent quote is never edited: a new price is a new revision that withdraws the old one in the
 * same transaction. A quote whose deposit is being paid is locked (L-10 step 4). Every change locks the request row,
 * so it cannot interleave with an acceptance of the same request.
 */
@Service
@RequiredArgsConstructor
public class QuoteServiceImpl implements QuoteService {

    /** Q-19, interim value: a quote stays valid 1 to 14 days. */
    static final int MIN_VALID_DAYS = 1;

    static final int MAX_VALID_DAYS = 14;

    private final QuoteRepository quoteRepository;
    private final QuoteAcceptanceRepository quoteAcceptanceRepository;
    private final RequestInvitationRepository requestInvitationRepository;
    private final VendorDirectory vendorDirectory;
    private final RequestAccessPolicy requestAccessPolicy;
    private final OutboxService outboxService;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<QuoteResponse> getQuotes(String accountId, String role, String requestId) {
        QuoteRequest request = requestAccessPolicy.getRequest(requestId);
        Viewer viewer = requestAccessPolicy.viewerOf(accountId, role, request);

        List<Quote> quotes = Revisions.latest(quoteRepository.findByRequestIdOrderBySubmittedAtAsc(requestId)).stream()
                .filter(q -> viewer.canSeeVendor(q.getVendorId()))
                .toList();
        Map<String, String> names =
                vendorDirectory.namesOf(quotes.stream().map(Quote::getVendorId).toList());
        Instant now = clock.instant();
        return quotes.stream()
                .map(q -> QuoteMapper.toResponse(q, names.get(q.getVendorId()), now, null))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public QuoteResponse getQuote(
            String accountId, String role, String requestId, String quoteId, boolean includeRevisions) {
        QuoteRequest request = requestAccessPolicy.getRequest(requestId);
        Viewer viewer = requestAccessPolicy.viewerOf(accountId, role, request);
        Quote quote = getVisibleQuote(viewer, requestId, quoteId);

        String vendorName =
                vendorDirectory.namesOf(List.of(quote.getVendorId())).get(quote.getVendorId());
        Instant now = clock.instant();
        List<QuoteResponse> previous = null;
        if (includeRevisions) {
            previous =
                    Revisions.previousOf(quote, quoteRepository.findByRequestIdOrderBySubmittedAtAsc(requestId))
                            .stream()
                            .map(q -> QuoteMapper.toResponse(q, vendorName, now, null))
                            .toList();
        }
        return QuoteMapper.toResponse(quote, vendorName, now, previous);
    }

    @Override
    @Transactional
    public QuoteResponse submit(String accountId, String requestId, SubmitQuoteRequest body) {
        VendorSnapshot vendor = vendorDirectory.getOwnedBy(accountId);
        if (!vendor.isTakingOrders()) {
            throw new AppException(ErrorCode.VENDOR_NOT_ACCEPTING_ORDERS);
        }
        QuoteRequest request = requestAccessPolicy.lockRequest(requestId);
        RequestInvitation invitation = requireQuotable(request, vendor);
        Instant now = clock.instant();
        QuoteTerms terms = toTerms(request, body, now);
        Quote previous = replacePrevious(request, vendor, body.supersedesQuoteId(), now);

        Quote quote = quoteRepository.saveAndFlush(Quote.submit(requestId, vendor.getVendorId(), previous, terms, now));
        invitation.markQuoted(now);
        String eventId = UUID.randomUUID().toString();
        outboxService.enqueue(
                eventId,
                QuoteSubmittedEvent.ROUTING_KEY,
                new QuoteSubmittedEvent(
                        eventId,
                        now,
                        quote.getId(),
                        requestId,
                        request.getBuyerAccountId(),
                        vendor.getVendorId(),
                        quote.getRevisionNo(),
                        quote.getTotalAmount(),
                        quote.getValidUntil()));

        return QuoteMapper.toResponse(quote, vendor.getBusinessName(), now, null);
    }

    /** The only change to a sent quote is withdrawing it (BR-05). */
    @Override
    @Transactional
    public QuoteResponse update(String accountId, String requestId, String quoteId, UpdateQuoteRequest body) {
        if (body.status() != QuoteStatus.WITHDRAWN) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION, body.status());
        }
        VendorSnapshot vendor = vendorDirectory.getOwnedBy(accountId);
        QuoteRequest request = requestAccessPolicy.lockRequest(requestId);
        Quote quote = quoteRepository
                .findByIdAndRequestId(quoteId, requestId)
                .filter(q -> q.getVendorId().equals(vendor.getVendorId()))
                .orElseThrow(() -> new AppException(ErrorCode.QUOTE_NOT_FOUND));

        Instant now = clock.instant();
        withdraw(quote, now);

        String eventId = UUID.randomUUID().toString();
        outboxService.enqueue(
                eventId,
                QuoteWithdrawnEvent.ROUTING_KEY,
                new QuoteWithdrawnEvent(
                        eventId, now, quoteId, requestId, request.getBuyerAccountId(), vendor.getVendorId()));
        return QuoteMapper.toResponse(quote, vendor.getBusinessName(), now, null);
    }

    @Override
    @Transactional
    public int expireOverdue() {
        return quoteRepository.expireOverdue(
                clock.instant(), QuoteStatus.SUBMITTED, QuoteStatus.EXPIRED, AcceptanceStatus.PENDING_PAYMENT);
    }

    private Quote getVisibleQuote(Viewer viewer, String requestId, String quoteId) {
        return quoteRepository
                .findByIdAndRequestId(quoteId, requestId)
                .filter(q -> viewer.canSeeVendor(q.getVendorId()))
                .orElseThrow(() -> new AppException(ErrorCode.QUOTE_NOT_FOUND));
    }

    /** Only an invited vendor quotes an open request, never its own owner's request (BR-22, AC-16.4). */
    private RequestInvitation requireQuotable(QuoteRequest request, VendorSnapshot vendor) {
        if (vendor.isOwnedBy(request.getBuyerAccountId())) {
            throw new AppException(ErrorCode.SELF_DEALING);
        }
        if (!request.isOpen()) {
            throw new AppException(ErrorCode.REQUEST_NOT_OPEN);
        }
        RequestInvitation invitation = requestInvitationRepository
                .findByRequestIdAndVendorId(request.getId(), vendor.getVendorId())
                .orElseThrow(() -> new AppException(ErrorCode.INVITATION_NOT_FOUND));
        if (invitation.isDeclined()) {
            throw new AppException(ErrorCode.INVITATION_DECLINED);
        }
        return invitation;
    }

    private QuoteTerms toTerms(QuoteRequest request, SubmitQuoteRequest body, Instant now) {
        LocalDate today = LocalDate.now(clock.withZone(TimeConstant.VIETNAM_ZONE));
        if (body.deliveryDate().isBefore(today)) {
            throw new AppException(ErrorCode.DELIVERY_DATE_PASSED);
        }
        if (body.validDays() < MIN_VALID_DAYS || body.validDays() > MAX_VALID_DAYS) {
            throw new AppException(ErrorCode.INVALID_VALIDITY, MIN_VALID_DAYS, MAX_VALID_DAYS);
        }
        List<QuoteItem> items = new ArrayList<>();
        for (QuoteItemRequest line : body.items()) {
            items.add(QuoteItem.product(
                    line.description().strip(), line.productRef(), line.quantity(), line.unitPrice()));
        }
        List<CustomItemRequest> customLines = body.customItems() == null ? List.of() : body.customItems();
        for (CustomItemRequest line : customLines) {
            if (!request.getCustomTypes().contains(line.customType())) {
                throw new AppException(ErrorCode.INVALID_QUOTE_LINES, "yêu cầu không có custom " + line.customType());
            }
            items.add(
                    QuoteItem.custom(line.customType(), line.description().strip(), line.quantity(), line.unitPrice()));
        }
        return QuoteTerms.compute(
                items,
                body.shippingFee(),
                body.depositRate(),
                body.deliveryDate(),
                body.deliveryMethod().strip(),
                now.plus(Duration.ofDays(body.validDays())),
                body.notes());
    }

    /**
     * BR-05: a new price replaces the vendor's latest quote, which is withdrawn first. Without supersedesQuoteId the
     * vendor must have no live quote. The withdrawal is flushed before the new row is inserted: the database allows
     * one SUBMITTED quote per vendor and request, and Hibernate would otherwise insert before it updates.
     */
    private Quote replacePrevious(QuoteRequest request, VendorSnapshot vendor, String supersedesQuoteId, Instant now) {
        boolean replacing = supersedesQuoteId != null && !supersedesQuoteId.isBlank();
        quoteRepository
                .findByRequestIdAndVendorIdAndStatus(request.getId(), vendor.getVendorId(), QuoteStatus.SUBMITTED)
                .filter(live -> !replacing || !live.getId().equals(supersedesQuoteId))
                .ifPresent(live -> {
                    throw new AppException(ErrorCode.QUOTE_ALREADY_SUBMITTED);
                });
        if (!replacing) {
            return null;
        }
        Quote previous = quoteRepository
                .findByIdAndRequestId(supersedesQuoteId, request.getId())
                .filter(q -> q.getVendorId().equals(vendor.getVendorId()))
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_SUPERSEDED_QUOTE));
        boolean replaceable =
                previous.getStatus() == QuoteStatus.SUBMITTED || previous.getStatus() == QuoteStatus.WITHDRAWN;
        if (!replaceable || quoteRepository.existsBySupersedesQuoteId(previous.getId())) {
            throw new AppException(ErrorCode.INVALID_SUPERSEDED_QUOTE);
        }
        if (previous.isSubmitted()) {
            withdraw(previous, now);
            quoteRepository.saveAndFlush(previous);
        }
        return previous;
    }

    private void withdraw(Quote quote, Instant now) {
        if (quoteAcceptanceRepository.existsByQuoteIdAndStatus(quote.getId(), AcceptanceStatus.PENDING_PAYMENT)) {
            throw new AppException(ErrorCode.QUOTE_LOCKED);
        }
        quote.withdraw(now);
    }
}
