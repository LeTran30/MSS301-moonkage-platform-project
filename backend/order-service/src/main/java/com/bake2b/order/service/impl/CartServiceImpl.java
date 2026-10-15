package com.bake2b.order.service.impl;

import com.bake2b.order.repository.CartItemRepository;
import com.bake2b.order.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
}
