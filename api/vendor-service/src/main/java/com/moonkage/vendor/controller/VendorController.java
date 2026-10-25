package com.moonkage.vendor.controller;

import com.moonkage.vendor.dto.request.CreateVendorDocumentRequest;
import com.moonkage.vendor.dto.request.CreateVendorReviewRequest;
import com.moonkage.vendor.dto.request.SaveDeliveryAreasRequest;
import com.moonkage.vendor.dto.request.SaveOrderProfileRequest;
import com.moonkage.vendor.dto.request.SubmitVendorRequest;
import com.moonkage.vendor.dto.request.UpdateVendorRequest;
import com.moonkage.vendor.dto.response.OrderProfileResponse;
import com.moonkage.vendor.dto.response.OwnerCheckResponse;
import com.moonkage.vendor.dto.response.RegistrationFeePaymentResponse;
import com.moonkage.vendor.dto.response.UploadSlotResponse;
import com.moonkage.vendor.dto.response.VendorDocumentLinkResponse;
import com.moonkage.vendor.dto.response.VendorDocumentResponse;
import com.moonkage.vendor.dto.response.VendorResponse;
import com.moonkage.vendor.dto.response.VendorReviewResponse;
import com.moonkage.vendor.service.DeliveryAreaService;
import com.moonkage.vendor.service.OrderProfileService;
import com.moonkage.vendor.service.VendorService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Parameter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Vendor applications, review and seller settings (docs/architecture/api-db/vendor.md, Root Vendor).
 * X-Account-Id and X-User-Role come from the gateway, taken from the access token.
 */
@RestController
@RequiredArgsConstructor
public class VendorController {

    /** {@code ?ownerAccountId=me} stands for the caller (FR-27). */
    private static final String OWNER_ME = "me";

    private final VendorService vendorService;
    private final DeliveryAreaService deliveryAreaService;
    private final OrderProfileService orderProfileService;

    @PostMapping("/api/vendors/uploads")
    public ResponseEntity<UploadSlotResponse> createUploadSlot(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId) {
        return ResponseEntity.ok(vendorService.createUploadSlot(accountId));
    }

    @PostMapping("/api/vendors")
    public ResponseEntity<VendorResponse> submit(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @RequestBody SubmitVendorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vendorService.submit(accountId, request));
    }

    @GetMapping("/api/vendors")
    public ResponseEntity<List<VendorResponse>> searchVendors(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @RequestParam(required = false) String ownerAccountId,
            @RequestParam(required = false) String status) {
        String owner = OWNER_ME.equals(ownerAccountId) ? accountId : ownerAccountId;
        return ResponseEntity.ok(vendorService.searchVendors(role, owner, status));
    }

    @GetMapping("/api/vendors/{vendorId}")
    public ResponseEntity<VendorResponse> getVendor(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @PathVariable String vendorId) {
        return ResponseEntity.ok(vendorService.getVendor(accountId, role, vendorId));
    }

    /** Allowed only while NEEDS_INFO or REJECTED (AC-27.2). */
    @PutMapping("/api/vendors/{vendorId}")
    public ResponseEntity<VendorResponse> resubmit(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @PathVariable String vendorId,
            @RequestBody SubmitVendorRequest request) {
        return ResponseEntity.ok(vendorService.resubmit(accountId, vendorId, request));
    }

    @PatchMapping("/api/vendors/{vendorId}")
    public ResponseEntity<VendorResponse> update(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @PathVariable String vendorId,
            @RequestBody UpdateVendorRequest request) {
        return ResponseEntity.ok(vendorService.update(accountId, role, vendorId, request));
    }

    @GetMapping("/api/vendors/{vendorId}/documents/{documentId}")
    public ResponseEntity<VendorDocumentLinkResponse> getDocumentLink(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @PathVariable String vendorId,
            @PathVariable String documentId) {
        return ResponseEntity.ok(vendorService.getDocumentLink(accountId, role, vendorId, documentId));
    }

    @PostMapping("/api/vendors/{vendorId}/documents")
    public ResponseEntity<VendorDocumentResponse> createDocument(
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @PathVariable String vendorId,
            @RequestBody CreateVendorDocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vendorService.createDocument(role, vendorId, request));
    }

    @GetMapping("/api/vendors/{vendorId}/delivery-areas")
    public ResponseEntity<List<String>> getDeliveryAreas(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId, @PathVariable String vendorId) {
        return ResponseEntity.ok(deliveryAreaService.getDeliveryAreas(accountId, vendorId));
    }

    @PutMapping("/api/vendors/{vendorId}/delivery-areas")
    public ResponseEntity<List<String>> saveDeliveryAreas(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @PathVariable String vendorId,
            @RequestBody SaveDeliveryAreasRequest request) {
        return ResponseEntity.ok(deliveryAreaService.saveDeliveryAreas(accountId, vendorId, request));
    }

    @GetMapping("/api/vendors/{vendorId}/order-profile")
    public ResponseEntity<OrderProfileResponse> getOrderProfile(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId, @PathVariable String vendorId) {
        return ResponseEntity.ok(orderProfileService.getOrderProfile(accountId, vendorId));
    }

    @PutMapping("/api/vendors/{vendorId}/order-profile")
    public ResponseEntity<OrderProfileResponse> saveOrderProfile(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @PathVariable String vendorId,
            @RequestBody SaveOrderProfileRequest request) {
        return ResponseEntity.ok(orderProfileService.saveOrderProfile(accountId, vendorId, request));
    }

    @GetMapping("/api/vendors/{vendorId}/owner-checks")
    public ResponseEntity<List<OwnerCheckResponse>> getOwnerChecks(
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role, @PathVariable String vendorId) {
        return ResponseEntity.ok(vendorService.getOwnerChecks(role, vendorId));
    }

    @GetMapping("/api/vendors/{vendorId}/reviews")
    public ResponseEntity<List<VendorReviewResponse>> getReviews(
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role, @PathVariable String vendorId) {
        return ResponseEntity.ok(vendorService.getReviews(role, vendorId));
    }

    /** Creating a review moves the vendor to the decided status (AC-45.2 - AC-45.5). */
    @PostMapping("/api/vendors/{vendorId}/reviews")
    public ResponseEntity<VendorReviewResponse> createReview(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId,
            @Parameter(hidden = true) @RequestHeader("X-User-Role") String role,
            @PathVariable String vendorId,
            @RequestBody CreateVendorReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vendorService.createReview(accountId, role, vendorId, request));
    }

    @GetMapping("/api/vendors/{vendorId}/registration-fee-payments")
    public ResponseEntity<List<RegistrationFeePaymentResponse>> getRegistrationFeePayments(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId, @PathVariable String vendorId) {
        return ResponseEntity.ok(vendorService.getRegistrationFeePayments(accountId, vendorId));
    }

    /** Charges the fee in effect now (AC-53.3). */
    @PostMapping("/api/vendors/{vendorId}/registration-fee-payments")
    public ResponseEntity<RegistrationFeePaymentResponse> createRegistrationFeePayment(
            @Parameter(hidden = true) @RequestHeader("X-Account-Id") String accountId, @PathVariable String vendorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vendorService.createRegistrationFeePayment(accountId, vendorId));
    }

    /** Called by other services through OpenFeign only; the gateway blocks /internal/** from outside. */
    @Hidden
    @GetMapping("/internal/vendors/by-owner/{accountId}")
    public ResponseEntity<VendorResponse> getByOwnerAccountId(@PathVariable String accountId) {
        return ResponseEntity.of(vendorService.findByOwnerAccountId(accountId));
    }
}
