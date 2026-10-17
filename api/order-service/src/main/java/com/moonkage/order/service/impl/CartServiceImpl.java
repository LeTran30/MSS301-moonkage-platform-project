package com.moonkage.order.service.impl;

import com.moonkage.order.repository.CartItemRepository;
import com.moonkage.order.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
}
