package com.moonkage.order.controller;

import com.moonkage.order.dto.request.AttachFileRequest;
import com.moonkage.order.dto.request.FileUploadRequest;
import com.moonkage.order.dto.request.ReviewMockupRequest;
import com.moonkage.order.dto.response.FileLinkResponse;
import com.moonkage.order.dto.response.MockupResponse;
import com.moonkage.order.dto.response.PresignedUploadLinkResponse;
import com.moonkage.order.exception.ApiResponse;
import com.moonkage.order.security.CurrentUser;
import com.moonkage.order.security.CurrentUserInfo;
import com.moonkage.order.service.OrderDocumentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Files of an order (order.md): uploads, mockup versions, the vendor's invoice. */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderDocumentController {

    private final OrderDocumentService documentService;

    /** Step 1 of a mockup, progress photo, invoice or evidence upload; then send tempKey where it is attached. */
    @PostMapping("/uploads")
    public ApiResponse<PresignedUploadLinkResponse> createUploadLink(
            @CurrentUser CurrentUserInfo caller, @Valid @RequestBody FileUploadRequest request) {
        return ApiResponse.ok(documentService.createUploadLink(request));
    }

    @GetMapping("/{orderId}/mockups")
    public ApiResponse<List<MockupResponse>> mockups(
            @CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.ok(documentService.mockups(caller, orderId));
    }

    /** FR-39: the vendor sends a new version. */
    @PostMapping("/{orderId}/mockups")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MockupResponse> uploadMockup(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @Valid @RequestBody AttachFileRequest request) {
        return ApiResponse.created(documentService.uploadMockup(caller, orderId, request));
    }

    /** FR-20: the buyer approves or asks for changes. */
    @PatchMapping("/{orderId}/mockups/{versionNo}")
    public ApiResponse<MockupResponse> reviewMockup(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @PathVariable int versionNo,
            @Valid @RequestBody ReviewMockupRequest request) {
        return ApiResponse.ok(documentService.reviewMockup(caller, orderId, versionNo, request));
    }

    /** FR-25: a link to the vendor's invoice. */
    @GetMapping("/{orderId}/invoice")
    public ApiResponse<FileLinkResponse> invoice(@CurrentUser CurrentUserInfo caller, @PathVariable String orderId) {
        return ApiResponse.ok(documentService.invoice(caller, orderId));
    }

    /** FR-44: the vendor attaches the invoice it issued. */
    @PutMapping("/{orderId}/invoice")
    public ApiResponse<FileLinkResponse> attachInvoice(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String orderId,
            @Valid @RequestBody AttachFileRequest request) {
        return ApiResponse.ok(documentService.attachInvoice(caller, orderId, request));
    }
}
