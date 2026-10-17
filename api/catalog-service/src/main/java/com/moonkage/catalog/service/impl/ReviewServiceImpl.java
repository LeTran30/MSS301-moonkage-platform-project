package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.repository.ReviewRepository;
import com.moonkage.catalog.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
}
