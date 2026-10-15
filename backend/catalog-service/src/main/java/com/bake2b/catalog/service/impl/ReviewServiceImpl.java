package com.bake2b.catalog.service.impl;

import com.bake2b.catalog.repository.ReviewRepository;
import com.bake2b.catalog.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
}
