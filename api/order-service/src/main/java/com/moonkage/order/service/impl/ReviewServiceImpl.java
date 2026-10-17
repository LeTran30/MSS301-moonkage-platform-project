package com.moonkage.order.service.impl;

import com.moonkage.order.repository.ReviewRepository;
import com.moonkage.order.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
}
