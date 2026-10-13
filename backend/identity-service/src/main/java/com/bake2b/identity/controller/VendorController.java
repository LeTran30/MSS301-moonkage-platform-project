package com.bake2b.identity.controller;

import com.bake2b.identity.service.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Covers: FR-26, FR-27, FR-46, FR-47. Endpoints not implemented yet. */
@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;
}
