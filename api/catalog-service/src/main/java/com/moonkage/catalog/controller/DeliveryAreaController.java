package com.moonkage.catalog.controller;

import com.moonkage.catalog.service.DeliveryAreaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/delivery-areas")
@RequiredArgsConstructor
public class DeliveryAreaController {

    private final DeliveryAreaService deliveryAreaService;
}
