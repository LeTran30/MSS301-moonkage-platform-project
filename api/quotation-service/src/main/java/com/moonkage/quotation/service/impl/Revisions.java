package com.moonkage.quotation.service.impl;

import com.moonkage.quotation.entity.Quote;
import com.moonkage.quotation.enums.QuoteStatus;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Revision chains of quotes (BR-05): each new revision points to the one it replaced. */
final class Revisions {

    private Revisions() {}

    /** The quotes no other quote replaced, in the given order. */
    static List<Quote> latest(List<Quote> quotes) {
        Set<String> replaced = quotes.stream()
                .map(Quote::getSupersedesQuoteId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        return quotes.stream().filter(q -> !replaced.contains(q.getId())).toList();
    }

    /** AC-16.3: quotes the buyer can still compare, i.e. latest revisions that were not withdrawn. */
    static int countLive(List<Quote> quotes) {
        return (int) latest(quotes).stream()
                .filter(q -> q.getStatus() != QuoteStatus.WITHDRAWN)
                .count();
    }

    /** The revisions {@code quote} replaced, newest first. */
    static List<Quote> previousOf(Quote quote, List<Quote> sameRequest) {
        Map<String, Quote> byId = sameRequest.stream().collect(Collectors.toMap(Quote::getId, Function.identity()));
        List<Quote> chain = new ArrayList<>();
        Quote previous = byId.get(quote.getSupersedesQuoteId());
        while (previous != null) {
            chain.add(previous);
            previous = byId.get(previous.getSupersedesQuoteId());
        }
        return chain;
    }
}
