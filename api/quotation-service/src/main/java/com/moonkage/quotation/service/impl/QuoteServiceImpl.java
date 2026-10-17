package com.moonkage.quotation.service.impl;

import com.moonkage.quotation.repository.QuoteRepository;
import com.moonkage.quotation.service.QuoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class QuoteServiceImpl implements QuoteService {

    private final QuoteRepository quoteRepository;
}
