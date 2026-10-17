package com.moonkage.vendor.controller;

import com.moonkage.vendor.dto.response.VendorResponse;
import com.moonkage.vendor.service.VendorService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Called by other services through OpenFeign only; the gateway blocks internal paths from outside. */
@Hidden
@RestController
@RequestMapping("/internal/vendors")
@RequiredArgsConstructor
public class InternalVendorController {

    private final VendorService vendorService;

    @GetMapping("/by-owner/{accountId}")
    public ResponseEntity<VendorResponse> getByOwnerAccountId(@PathVariable String accountId) {
        return ResponseEntity.of(vendorService.findByOwnerAccountId(accountId));
    }
}
