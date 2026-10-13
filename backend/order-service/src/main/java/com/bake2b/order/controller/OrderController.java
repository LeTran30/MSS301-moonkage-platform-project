package com.bake2b.order.controller;

import com.bake2b.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Covers: FR-09 - FR-11, FR-19 - FR-22, FR-24, FR-25, FR-33, FR-39, FR-40, FR-42, FR-44. Endpoints not implemented yet. */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
}
