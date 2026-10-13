package com.bake2b.catalog.controller;

import com.bake2b.catalog.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Covers: FR-04 - FR-07, FR-30 - FR-32, FR-47. Endpoints not implemented yet. */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
}
