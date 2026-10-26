package com.moonkage.catalog.controller;

import com.moonkage.catalog.dto.request.ProductSnapshotRequest;
import com.moonkage.catalog.dto.response.ProductSnapshotResponse;
import com.moonkage.catalog.service.ProductSnapshotService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Called by order-service through OpenFeign only; the gateway blocks /internal/**. Unwrapped. */
@Hidden
@RestController
@Profile("!legacy-writer")
@RequiredArgsConstructor
public class InternalProductController {

    private final ProductSnapshotService snapshotService;

    /** Cart and checkout: products as catalog shows them and the delivery fee of each vendor (BR-30, D-14). */
    @PostMapping("/internal/products/snapshot")
    public ProductSnapshotResponse snapshot(@Valid @RequestBody ProductSnapshotRequest request) {
        return snapshotService.snapshot(request);
    }
}
