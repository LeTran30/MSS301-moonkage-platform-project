package com.moonkage.identity.controller;

import com.moonkage.identity.dto.response.VendorInternalResponse;
import com.moonkage.identity.service.VendorService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Called by other services through OpenFeign only. */
@Hidden
@RestController
@RequestMapping("/internal/vendors")
@RequiredArgsConstructor
public class InternalVendorController {

    private final VendorService vendorService;

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<VendorInternalResponse> getByOwnerUserId(@PathVariable String userId) {
        return ResponseEntity.of(vendorService.findByOwnerUserId(userId));
    }
}
