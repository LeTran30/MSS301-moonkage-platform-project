package com.moonkage.quotation.dto.request;

import jakarta.validation.Valid;

/** @param invoiceInfo optional business invoice (FR-24) */
public record AcceptQuoteRequest(@Valid InvoiceInfoRequest invoiceInfo) {}
