package com.moonkage.catalog.controller;

import com.moonkage.catalog.service.OrderProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/order-profiles")
@RequiredArgsConstructor
public class OrderProfileController {

    private final OrderProfileService orderProfileService;
}
