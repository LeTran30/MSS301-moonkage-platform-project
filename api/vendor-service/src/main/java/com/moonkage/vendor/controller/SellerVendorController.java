package com.moonkage.vendor.controller;

import com.moonkage.vendor.dto.response.VendorResponse;
import com.moonkage.vendor.service.VendorService;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The caller's own vendor (FR-27). Replaces vendorStatus/vendorId that identity used to put in the login reply.
 * X-Account-Id comes from the gateway, taken from the access token.
 */
@RestController
@RequestMapping("/api/seller/vendor")
@RequiredArgsConstructor
public class SellerVendorController {

    private final VendorService vendorService;

    /** 404 when the account owns no vendor (vendorStatus NONE). */
    @GetMapping
    public ResponseEntity<VendorResponse> getMyVendor(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId) {
        return ResponseEntity.of(vendorService.findByOwnerAccountId(accountId));
    }
}
