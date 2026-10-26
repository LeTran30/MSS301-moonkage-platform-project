package com.moonkage.vendor.web;

import com.moonkage.vendor.common.exception.ApiResponse;
import com.moonkage.vendor.deliveryarea.DeliveryAreaService;
import com.moonkage.vendor.deliveryarea.dto.SaveDeliveryAreasRequest;
import com.moonkage.vendor.orderprofile.OrderProfileService;
import com.moonkage.vendor.orderprofile.dto.request.SaveOrderProfileRequest;
import com.moonkage.vendor.orderprofile.dto.response.OrderProfileResponse;
import com.moonkage.vendor.security.CurrentUser;
import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.VendorService;
import com.moonkage.vendor.vendor.VendorStatus;
import com.moonkage.vendor.vendor.dto.request.CreateVendorDocumentRequest;
import com.moonkage.vendor.vendor.dto.request.CreateVendorReviewRequest;
import com.moonkage.vendor.vendor.dto.request.DocumentUploadRequest;
import com.moonkage.vendor.vendor.dto.request.SubmitVendorRequest;
import com.moonkage.vendor.vendor.dto.request.UpdateVendorRequest;
import com.moonkage.vendor.vendor.dto.response.OwnerCheckResponse;
import com.moonkage.vendor.vendor.dto.response.PresignedUploadLinkResponse;
import com.moonkage.vendor.vendor.dto.response.RegistrationFeePaymentResponse;
import com.moonkage.vendor.vendor.dto.response.VendorDetailResponse;
import com.moonkage.vendor.vendor.dto.response.VendorDocumentLinkResponse;
import com.moonkage.vendor.vendor.dto.response.VendorDocumentResponse;
import com.moonkage.vendor.vendor.dto.response.VendorResponse;
import com.moonkage.vendor.vendor.dto.response.VendorReviewResponse;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Vendor applications, review and seller settings (docs/architecture/api-db/vendor.md, Root Vendor). The caller
 * comes from the gateway headers (@CurrentUser).
 */
@RestController
@RequiredArgsConstructor
public class VendorController {

    /** {@code ?ownerAccountId=me} stands for the caller (FR-27). */
    private static final String OWNER_ME = "me";

    private final VendorService vendorService;
    private final DeliveryAreaService deliveryAreaService;
    private final OrderProfileService orderProfileService;

    /**
     * Upload a legal document straight to MinIO: POST formFields and the file to uploadUrl, then send tempKey as a
     * document's objectKey when submitting the profile (AC-26.1).
     */
    @PostMapping("/api/vendors/uploads")
    public ResponseEntity<ApiResponse<PresignedUploadLinkResponse>> createDocumentUploadLink(
            @CurrentUser CurrentUserInfo caller, @Valid @RequestBody DocumentUploadRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.createDocumentUploadLink(caller, request)));
    }

    @PostMapping("/api/vendors")
    public ResponseEntity<ApiResponse<VendorDetailResponse>> submit(
            @CurrentUser CurrentUserInfo caller, @Valid @RequestBody SubmitVendorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(vendorService.submit(caller, request)));
    }

    @GetMapping("/api/vendors")
    public ResponseEntity<ApiResponse<List<VendorResponse>>> searchVendors(
            @CurrentUser CurrentUserInfo caller,
            @RequestParam(required = false) String ownerAccountId,
            @RequestParam(required = false) VendorStatus status) {
        String owner = OWNER_ME.equals(ownerAccountId) ? caller.accountId() : ownerAccountId;
        return ResponseEntity.ok(ApiResponse.ok(vendorService.searchVendors(caller, owner, status)));
    }

    @GetMapping("/api/vendors/{vendorId}")
    public ResponseEntity<ApiResponse<VendorDetailResponse>> getVendor(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.getVendor(caller, vendorId)));
    }

    /** Allowed only while NEEDS_INFO or REJECTED (AC-27.2). */
    @PutMapping("/api/vendors/{vendorId}")
    public ResponseEntity<ApiResponse<VendorDetailResponse>> resubmit(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @Valid @RequestBody SubmitVendorRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.resubmit(caller, vendorId, request)));
    }

    @PatchMapping("/api/vendors/{vendorId}")
    public ResponseEntity<ApiResponse<VendorResponse>> update(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @RequestBody UpdateVendorRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.update(caller, vendorId, request)));
    }

    @GetMapping("/api/vendors/{vendorId}/documents/{documentId}")
    public ResponseEntity<ApiResponse<VendorDocumentLinkResponse>> getDocumentLink(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId, @PathVariable String documentId) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.getDocumentLink(caller, vendorId, documentId)));
    }

    @PostMapping("/api/vendors/{vendorId}/documents")
    public ResponseEntity<ApiResponse<VendorDocumentResponse>> createDocument(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @RequestBody CreateVendorDocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(vendorService.createDocument(caller, vendorId, request)));
    }

    @GetMapping("/api/vendors/{vendorId}/delivery-areas")
    public ResponseEntity<ApiResponse<List<String>>> getDeliveryAreas(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(deliveryAreaService.getDeliveryAreas(caller, vendorId)));
    }

    @PutMapping("/api/vendors/{vendorId}/delivery-areas")
    public ResponseEntity<ApiResponse<List<String>>> saveDeliveryAreas(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @RequestBody SaveDeliveryAreasRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(deliveryAreaService.saveDeliveryAreas(caller, vendorId, request)));
    }

    @GetMapping("/api/vendors/{vendorId}/order-profile")
    public ResponseEntity<ApiResponse<OrderProfileResponse>> getOrderProfile(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(orderProfileService.getOrderProfile(caller, vendorId)));
    }

    @PutMapping("/api/vendors/{vendorId}/order-profile")
    public ResponseEntity<ApiResponse<OrderProfileResponse>> saveOrderProfile(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @RequestBody SaveOrderProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(orderProfileService.saveOrderProfile(caller, vendorId, request)));
    }

    @GetMapping("/api/vendors/{vendorId}/owner-checks")
    public ResponseEntity<ApiResponse<List<OwnerCheckResponse>>> getOwnerChecks(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.getOwnerChecks(caller, vendorId)));
    }

    @GetMapping("/api/vendors/{vendorId}/reviews")
    public ResponseEntity<ApiResponse<List<VendorReviewResponse>>> getReviews(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.getReviews(caller, vendorId)));
    }

    /** Creating a review moves the vendor to the decided status (AC-45.2 - AC-45.5). */
    @PostMapping("/api/vendors/{vendorId}/reviews")
    public ResponseEntity<ApiResponse<VendorReviewResponse>> createReview(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @Valid @RequestBody CreateVendorReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(vendorService.createReview(caller, vendorId, request)));
    }

    @GetMapping("/api/vendors/{vendorId}/registration-fee-payments")
    public ResponseEntity<ApiResponse<List<RegistrationFeePaymentResponse>>> getRegistrationFeePayments(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.getRegistrationFeePayments(caller, vendorId)));
    }

    /** Charges the fee in effect now (AC-53.3). */
    @PostMapping("/api/vendors/{vendorId}/registration-fee-payments")
    public ResponseEntity<ApiResponse<RegistrationFeePaymentResponse>> createRegistrationFeePayment(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(vendorService.createRegistrationFeePayment(caller, vendorId)));
    }

    /** Called by other services through OpenFeign only; the gateway blocks /internal/** from outside. Unwrapped. */
    @Hidden
    @GetMapping("/internal/vendors/by-owner/{accountId}")
    public ResponseEntity<VendorResponse> getByOwnerAccountId(@PathVariable String accountId) {
        return ResponseEntity.of(vendorService.findByOwnerAccountId(accountId));
    }
}
