package com.bake2b.catalog.service.impl;

import com.bake2b.catalog.repository.ReviewRepository;
import com.bake2b.catalog.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-11, FR-34. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
}
