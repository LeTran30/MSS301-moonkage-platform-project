package com.bake2b.catalog.controller;

import com.bake2b.catalog.service.OrderProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Covers: FR-14, FR-35. Endpoints not implemented yet. */
@RestController
@RequestMapping("/api/order-profiles")
@RequiredArgsConstructor
public class OrderProfileController {

    private final OrderProfileService orderProfileService;
}
