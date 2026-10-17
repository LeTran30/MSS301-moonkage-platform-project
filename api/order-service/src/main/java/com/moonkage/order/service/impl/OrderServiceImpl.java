package com.moonkage.order.service.impl;

import com.moonkage.order.repository.MockupVersionRepository;
import com.moonkage.order.repository.OrderItemRepository;
import com.moonkage.order.repository.OrderRepository;
import com.moonkage.order.repository.ProgressUpdateRepository;
import com.moonkage.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MockupVersionRepository mockupVersionRepository;
    private final ProgressUpdateRepository progressUpdateRepository;
}
