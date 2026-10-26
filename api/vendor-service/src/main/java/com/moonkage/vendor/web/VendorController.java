package com.moonkage.vendor.web;

import com.moonkage.vendor.common.exception.ApiResponse;
import com.moonkage.vendor.security.CurrentUser;
import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.DeliveryAreaService;
import com.moonkage.vendor.vendor.OrderProfileService;
import com.moonkage.vendor.vendor.VendorService;
import com.moonkage.vendor.vendor.VendorStatus;
import com.moonkage.vendor.vendor.VendorView;
import com.moonkage.vendor.vendor.dto.request.CreateVendorDocumentRequest;
import com.moonkage.vendor.vendor.dto.request.CreateVendorReviewRequest;
import com.moonkage.vendor.vendor.dto.request.DocumentUploadRequest;
import com.moonkage.vendor.vendor.dto.request.SaveDeliveryAreasRequest;
import com.moonkage.vendor.vendor.dto.request.SaveOrderProfileRequest;
import com.moonkage.vendor.vendor.dto.request.SubmitVendorRequest;
import com.moonkage.vendor.vendor.dto.request.UpdateVendorRequest;
import com.moonkage.vendor.vendor.dto.response.OrderProfileResponse;
import com.moonkage.vendor.vendor.dto.response.OwnerCheckResponse;
import com.moonkage.vendor.vendor.dto.response.PresignedUploadLinkResponse;
import com.moonkage.vendor.vendor.dto.response.RegistrationFeePaymentLinkResponse;
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

    /**
     * FR-26: a member verified by NFC submits a vendor profile with its documents; PENDING until an admin
     * reviews it.
     */
    @PostMapping("/api/vendors")
    public ResponseEntity<ApiResponse<VendorDetailResponse>> submit(
            @CurrentUser CurrentUserInfo caller, @Valid @RequestBody SubmitVendorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(vendorService.submit(caller, request)));
    }

    /** {@code ownerAccountId=me}: the caller's own vendor (FR-27). {@code status=}: admin list to review (FR-45). */
    @GetMapping("/api/vendors")
    public ResponseEntity<ApiResponse<List<VendorResponse>>> searchVendors(
            @CurrentUser CurrentUserInfo caller,
            @RequestParam(required = false) String ownerAccountId,
            @RequestParam(required = false) VendorStatus status) {
        String owner = OWNER_ME.equals(ownerAccountId) ? caller.accountId() : ownerAccountId;
        return ResponseEntity.ok(ApiResponse.ok(vendorService.searchVendors(caller, owner, status)));
    }

    /** Owner or admin: profile, status, reason, canOperate (FR-27); the admin also sees the owner checks. */
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

    /** Owner: {localDeliveryFee} (FR-28). Admin: {status: LOCKED, statusReason} (FR-46). */
    @PatchMapping("/api/vendors/{vendorId}")
    public ResponseEntity<ApiResponse<VendorDetailResponse>> update(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @RequestBody UpdateVendorRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.update(caller, vendorId, request)));
    }

    /** Owner or admin: a short-lived link to a private document (AC-27.6, NFR-03). */
    @GetMapping("/api/vendors/{vendorId}/documents/{documentId}")
    public ResponseEntity<ApiResponse<VendorDocumentLinkResponse>> getDocumentLink(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId, @PathVariable String documentId) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.getDocumentLink(caller, vendorId, documentId)));
    }

    /** Admin: attaches the registration fee invoice (kind FEE_INVOICE, Q-36). */
    @PostMapping("/api/vendors/{vendorId}/documents")
    public ResponseEntity<ApiResponse<VendorDocumentResponse>> createDocument(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @Valid @RequestBody CreateVendorDocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(vendorService.createDocument(caller, vendorId, request)));
    }

    /** Owner: province codes the vendor delivers to (FR-28). */
    @GetMapping("/api/vendors/{vendorId}/delivery-areas")
    public ResponseEntity<ApiResponse<List<String>>> getDeliveryAreas(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(deliveryAreaService.getDeliveryAreas(caller, vendorId)));
    }

    /** Owner: replaces the delivery areas; at least one province (FR-28). */
    @PutMapping("/api/vendors/{vendorId}/delivery-areas")
    public ResponseEntity<ApiResponse<List<String>>> saveDeliveryAreas(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @Valid @RequestBody SaveDeliveryAreasRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(deliveryAreaService.saveDeliveryAreas(caller, vendorId, request)));
    }

    /** Owner: the order profile (FR-35); 404 VENDOR_016 when none yet. */
    @GetMapping("/api/vendors/{vendorId}/order-profile")
    public ResponseEntity<ApiResponse<OrderProfileResponse>> getOrderProfile(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(orderProfileService.getOrderProfile(caller, vendorId)));
    }

    /** Owner: the whole order profile again (FR-35); the terms required depend on the supply source. */
    @PutMapping("/api/vendors/{vendorId}/order-profile")
    public ResponseEntity<ApiResponse<OrderProfileResponse>> saveOrderProfile(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String vendorId,
            @Valid @RequestBody SaveOrderProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(orderProfileService.saveOrderProfile(caller, vendorId, request)));
    }

    /** Admin: how the owner matched the representative at each submission (AC-45.4). */
    @GetMapping("/api/vendors/{vendorId}/owner-checks")
    public ResponseEntity<ApiResponse<List<OwnerCheckResponse>>> getOwnerChecks(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.getOwnerChecks(caller, vendorId)));
    }

    /** Admin: past review decisions, oldest first (AC-45.5). */
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

    /** Owner or admin: registration fee payments made (AC-53.3). */
    @GetMapping("/api/vendors/{vendorId}/registration-fee-payments")
    public ResponseEntity<ApiResponse<List<RegistrationFeePaymentResponse>>> getRegistrationFeePayments(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.ok(ApiResponse.ok(vendorService.getRegistrationFeePayments(caller, vendorId)));
    }

    /** Charges the fee in effect now (AC-53.3). */
    @PostMapping("/api/vendors/{vendorId}/registration-fee-payments")
    public ResponseEntity<ApiResponse<RegistrationFeePaymentLinkResponse>> createRegistrationFeePayment(
            @CurrentUser CurrentUserInfo caller, @PathVariable String vendorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(vendorService.createRegistrationFeePayment(caller, vendorId)));
    }

    /** Called by other services through OpenFeign only; the gateway blocks /internal/** from outside. Unwrapped. */
    @Hidden
    @GetMapping("/internal/vendors/by-owner/{accountId}")
    public ResponseEntity<VendorView> getByOwnerAccountId(@PathVariable String accountId) {
        return ResponseEntity.of(vendorService.findByOwnerAccountId(accountId));
    }
}
