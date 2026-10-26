package com.moonkage.quotation.service.impl;

import com.moonkage.quotation.client.IdentityClient;
import com.moonkage.quotation.client.PaymentClient;
import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.config.QuotationProperties;
import com.moonkage.quotation.dto.client.CreatePaymentRequest;
import com.moonkage.quotation.dto.client.CreatePaymentResponse;
import com.moonkage.quotation.dto.client.CreateRefundRequest;
import com.moonkage.quotation.dto.client.NfcStatusResponse;
import com.moonkage.quotation.dto.event.QuoteAcceptedEvent;
import com.moonkage.quotation.dto.request.AcceptQuoteRequest;
import com.moonkage.quotation.dto.request.InvoiceInfoRequest;
import com.moonkage.quotation.dto.response.AcceptQuoteResponse;
import com.moonkage.quotation.dto.response.AcceptanceResponse;
import com.moonkage.quotation.entity.Quote;
import com.moonkage.quotation.entity.QuoteAcceptance;
import com.moonkage.quotation.entity.QuoteAcceptance.AcceptanceCopy;
import com.moonkage.quotation.entity.QuoteAcceptance.AcceptanceParties;
import com.moonkage.quotation.entity.QuoteAcceptance.Invoice;
import com.moonkage.quotation.entity.QuoteRequest;
import com.moonkage.quotation.entity.VendorSnapshot;
import com.moonkage.quotation.enums.AcceptanceStatus;
import com.moonkage.quotation.enums.QuoteStatus;
import com.moonkage.quotation.enums.RequestStatus;
import com.moonkage.quotation.mapper.AcceptanceMapper;
import com.moonkage.quotation.repository.QuoteAcceptanceRepository;
import com.moonkage.quotation.repository.QuoteRepository;
import com.moonkage.quotation.service.OutboxService;
import com.moonkage.quotation.service.QuoteAcceptanceService;
import com.moonkage.quotation.service.impl.RequestAccessPolicy.Viewer;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FR-19, BR-04, BR-17, L-10. Accepting freezes the quote into a binding copy (snapshot + SHA-256) and charges exactly
 * its deposit; nothing is final until payment-service reports the deposit paid. Then, in one transaction, the
 * acceptance succeeds, the quote is ACCEPTED, the request's other live quotes close and the request is AWARDED.
 * Every step locks the request row first, so two acceptances of one request cannot both win.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuoteAcceptanceServiceImpl implements QuoteAcceptanceService {

    private final QuoteAcceptanceRepository quoteAcceptanceRepository;
    private final QuoteRepository quoteRepository;
    private final VendorDirectory vendorDirectory;
    private final RequestAccessPolicy requestAccessPolicy;
    private final IdentityClient identityClient;
    private final PaymentClient paymentClient;
    private final OutboxService outboxService;
    private final QuotationProperties properties;
    private final Clock clock;

    @Override
    @Transactional
    public AcceptQuoteResponse accept(String accountId, String requestId, String quoteId, AcceptQuoteRequest body) {
        Invoice invoice = toInvoice(body);
        NfcStatusResponse buyer = identityClient.getNfcStatus(accountId);
        if (!buyer.isVerified()) {
            throw new AppException(ErrorCode.NFC_NOT_VERIFIED);
        }
        QuoteRequest request = requestAccessPolicy.lockRequest(requestId);
        Instant now = clock.instant();
        Quote quote = requireAcceptable(accountId, request, quoteId, now);
        VendorSnapshot vendor = requireVendorFor(accountId, quote);

        AcceptanceParties parties = new AcceptanceParties(
                buyer.legalName(), buyer.idNumberMasked(), vendor.getBusinessName(), vendor.getTaxCode(), invoice);
        String json =
                AgreementHasher.canonicalJson(AcceptanceMapper.toSnapshot(request, quote, accountId, parties, now));
        Instant paymentExpiresAt = earlier(now.plus(properties.depositPaymentTimeout()), quote.getValidUntil());
        QuoteAcceptance acceptance = quoteAcceptanceRepository.saveAndFlush(QuoteAcceptance.pending(
                quote,
                accountId,
                parties,
                new AcceptanceCopy(json, AgreementHasher.sha256Hex(json), paymentExpiresAt),
                now));

        // a failed call rolls the acceptance back, so the buyer simply accepts again
        CreatePaymentResponse payment = paymentClient.createPayment(CreatePaymentRequest.deposit(
                acceptance.getId(), accountId, acceptance.getDepositAmount(), paymentExpiresAt));
        acceptance.attachPayment(payment.paymentId());

        return AcceptanceMapper.toAcceptResponse(acceptance, payment.paymentUrl());
    }

    @Override
    @Transactional(readOnly = true)
    public AcceptanceResponse getAcceptance(String accountId, String role, String requestId, String quoteId) {
        QuoteRequest request = requestAccessPolicy.getRequest(requestId);
        Viewer viewer = requestAccessPolicy.viewerOf(accountId, role, request);
        Quote quote = quoteRepository
                .findByIdAndRequestId(quoteId, requestId)
                .filter(q -> viewer.canSeeVendor(q.getVendorId()))
                .orElseThrow(() -> new AppException(ErrorCode.QUOTE_NOT_FOUND));

        return quoteAcceptanceRepository
                .findFirstByQuoteIdOrderByAcceptedAtDesc(quote.getId())
                .map(AcceptanceMapper::toResponse)
                .orElseThrow(() -> new AppException(ErrorCode.ACCEPTANCE_NOT_FOUND));
    }

    @Override
    @Transactional
    public void recordDepositPaid(String acceptanceId, Instant paidAt) {
        QuoteAcceptance acceptance = lockAcceptance(acceptanceId);
        if (acceptance.getStatus() == AcceptanceStatus.SUCCEEDED) {
            return;
        }
        QuoteRequest request = requestAccessPolicy.getRequest(acceptance.getRequestId());
        Quote quote = quoteRepository
                .findById(acceptance.getQuoteId())
                .orElseThrow(() -> new AppException(ErrorCode.QUOTE_NOT_FOUND));
        boolean stillWinnable = acceptance.isPending()
                && request.isOpen()
                && quote.isSubmitted()
                && !quoteAcceptanceRepository.existsByRequestIdAndStatus(request.getId(), AcceptanceStatus.SUCCEEDED);
        if (!stillWinnable) {
            refundLateDeposit(acceptance);
            return;
        }

        acceptance.succeed(paidAt);
        quote.accept();
        quoteRepository.findByRequestIdOrderBySubmittedAtAsc(request.getId()).stream()
                .filter(q ->
                        q.getStatus() == QuoteStatus.SUBMITTED && !q.getId().equals(quote.getId()))
                .forEach(Quote::close);
        request.award();

        String eventId = UUID.randomUUID().toString();
        outboxService.enqueue(
                eventId,
                QuoteAcceptedEvent.ROUTING_KEY,
                new QuoteAcceptedEvent(
                        eventId,
                        clock.instant(),
                        acceptance.getId(),
                        quote.getId(),
                        request.getId(),
                        acceptance.getBuyerAccountId(),
                        acceptance.getVendorId(),
                        acceptance.getDepositAmount(),
                        acceptance.getPaymentRef(),
                        acceptance.getContentHash(),
                        acceptance.getSnapshot()));
    }

    @Override
    @Transactional
    public void recordDepositFailed(String acceptanceId) {
        QuoteAcceptance acceptance = lockAcceptance(acceptanceId);
        if (acceptance.isPending()) {
            acceptance.fail();
        }
    }

    @Override
    @Transactional
    public int expireOverdue() {
        return quoteAcceptanceRepository.expireOverdue(
                clock.instant(), AcceptanceStatus.PENDING_PAYMENT, AcceptanceStatus.EXPIRED);
    }

    /** FR-24: the four invoice fields come together or not at all; Bean Validation already checked each one. */
    private static Invoice toInvoice(AcceptQuoteRequest body) {
        if (body == null || body.invoiceInfo() == null) {
            return null;
        }
        InvoiceInfoRequest info = body.invoiceInfo();
        return new Invoice(
                info.name().strip(),
                info.taxCode(),
                info.address().strip(),
                info.email().strip());
    }

    /** BR-05, AC-17.3, BR-17: only the buyer, only a live quote, only one deposit in flight per quote. */
    private Quote requireAcceptable(String accountId, QuoteRequest request, String quoteId, Instant now) {
        if (!request.isOwnedBy(accountId)) {
            throw new AppException(ErrorCode.REQUEST_NOT_FOUND);
        }
        if (request.getStatus() == RequestStatus.AWARDED) {
            throw new AppException(ErrorCode.REQUEST_ALREADY_AWARDED);
        }
        if (!request.isOpen()) {
            throw new AppException(ErrorCode.REQUEST_NOT_OPEN);
        }
        Quote quote = quoteRepository
                .findByIdAndRequestId(quoteId, request.getId())
                .orElseThrow(() -> new AppException(ErrorCode.QUOTE_NOT_FOUND));
        if (!quote.isAcceptableAt(now)) {
            throw new AppException(ErrorCode.QUOTE_NOT_ACCEPTABLE);
        }
        if (quoteAcceptanceRepository.existsByQuoteIdAndStatus(quoteId, AcceptanceStatus.PENDING_PAYMENT)) {
            throw new AppException(ErrorCode.ACCEPTANCE_IN_PROGRESS);
        }
        return quote;
    }

    /** AC-19.4: the last guard against self-dealing (BR-22), whatever the earlier steps let through. */
    private VendorSnapshot requireVendorFor(String accountId, Quote quote) {
        VendorSnapshot vendor = vendorDirectory.getVendor(quote.getVendorId());
        if (vendor.isOwnedBy(accountId)) {
            throw new AppException(ErrorCode.SELF_DEALING);
        }
        if (!vendor.isTakingOrders()) {
            throw new AppException(ErrorCode.VENDOR_NOT_ACCEPTING_ORDERS);
        }
        if (vendor.getTaxCode() == null || vendor.getTaxCode().isBlank()) {
            throw new AppException(ErrorCode.VENDOR_TAX_CODE_MISSING);
        }
        return vendor;
    }

    /** Locks the request before loading the acceptance, the same order as {@link #accept}. */
    private QuoteAcceptance lockAcceptance(String acceptanceId) {
        String requestId = quoteAcceptanceRepository
                .findRequestIdById(acceptanceId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCEPTANCE_NOT_FOUND));
        requestAccessPolicy.lockRequest(requestId);
        return quoteAcceptanceRepository
                .findById(acceptanceId)
                .orElseThrow(() -> new AppException(ErrorCode.ACCEPTANCE_NOT_FOUND));
    }

    /** FR-19: the deposit came after the quote could no longer win, so the money goes back. */
    private void refundLateDeposit(QuoteAcceptance acceptance) {
        if (acceptance.isPending()) {
            acceptance.fail();
        }
        log.warn("Deposit of acceptance {} arrived after the quote closed; refunding", acceptance.getId());
        paymentClient.createRefund(
                CreateRefundRequest.quoteExpired(acceptance.getPaymentRef(), acceptance.getDepositAmount()));
    }

    private static Instant earlier(Instant a, Instant b) {
        return a.isBefore(b) ? a : b;
    }
}
