package com.moonkage.quotation.controller;

import com.moonkage.quotation.common.exception.ApiResponse;
import com.moonkage.quotation.dto.response.SupplierResponse;
import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.service.SupplierService;
import io.swagger.v3.oas.annotations.Parameter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Read-only root Supplier: vendors taking custom orders (FR-14). Works for a guest too (no X-Account-Id). */
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    /** @param minQty the quantity the buyer needs: only vendors whose minimum is at most this */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> searchSuppliers(
            @Parameter(hidden = true) @RequestHeader(value = "X-Account-Id", required = false) String accountId,
            @RequestParam(required = false) String provinceCode,
            @RequestParam(required = false) CustomType customType,
            @RequestParam(required = false) Integer minQty,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(
                ApiResponse.ok(supplierService.searchSuppliers(accountId, provinceCode, customType, minQty, q)));
    }

    @GetMapping("/{vendorId}")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplier(
            @Parameter(hidden = true) @RequestHeader(value = "X-Account-Id", required = false) String accountId,
            @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.getSupplier(accountId, vendorId)));
    }
}
