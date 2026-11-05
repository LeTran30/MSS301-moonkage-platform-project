package com.moonkage.catalog.controller;

import com.moonkage.api.ApiResponse;
import com.moonkage.api.GatewayHeader;
import com.moonkage.catalog.dto.request.SaveInterprovinceFeesRequest;
import com.moonkage.catalog.dto.response.InterprovinceFeeResponse;
import com.moonkage.catalog.dto.response.InterprovinceFeeTableResponse;
import com.moonkage.catalog.service.InterprovinceFeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interprovince-fees")
@RequiredArgsConstructor
public class InterprovinceFeeController {
    private final InterprovinceFeeService feeService;

    @GetMapping
    public ApiResponse<InterprovinceFeeTableResponse> getTable() {
        return ApiResponse.ok(feeService.getTable());
    }

    @GetMapping("/provinces/{provinceCode}")
    public ApiResponse<InterprovinceFeeResponse> getProvinceFee(@PathVariable String provinceCode) {
        return ApiResponse.ok(feeService.getProvinceFee(provinceCode));
    }

    @PutMapping
    public ApiResponse<InterprovinceFeeTableResponse> replace(
            @RequestHeader(value = GatewayHeader.ACCOUNT_ID, required = false) String accountId,
            @RequestHeader(value = GatewayHeader.USER_ROLE, required = false) String role,
            @RequestBody @Valid SaveInterprovinceFeesRequest request) {
        return ApiResponse.ok(feeService.replace(accountId, role, request));
    }
}
