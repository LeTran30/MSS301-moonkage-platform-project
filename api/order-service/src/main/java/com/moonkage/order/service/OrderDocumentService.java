package com.moonkage.order.service;

import com.moonkage.order.dto.request.AttachFileRequest;
import com.moonkage.order.dto.request.FileUploadRequest;
import com.moonkage.order.dto.request.ReviewMockupRequest;
import com.moonkage.order.dto.response.FileLinkResponse;
import com.moonkage.order.dto.response.MockupResponse;
import com.moonkage.order.dto.response.PresignedUploadLinkResponse;
import com.moonkage.order.security.CurrentUserInfo;
import java.util.List;

/** Files of an order: mockup versions (FR-20, FR-39) and the vendor's invoice (FR-25, FR-44). */
public interface OrderDocumentService {

    /** Step 1 of any order file upload; any member (the attach request checks who may attach what). */
    PresignedUploadLinkResponse createUploadLink(FileUploadRequest request);

    List<MockupResponse> mockups(CurrentUserInfo caller, String orderId);

    /**
     * The vendor sends a new mockup version; earlier ones are kept (BR-15). The first one moves a deposited custom
     * order to AWAITING_MOCKUP_APPROVAL.
     */
    MockupResponse uploadMockup(CurrentUserInfo caller, String orderId, AttachFileRequest request);

    /** The buyer approves a version or asks for changes with a note (FR-20). */
    MockupResponse reviewMockup(CurrentUserInfo caller, String orderId, int versionNo, ReviewMockupRequest request);

    /** FR-25: buyer, vendor owner or admin; 404 ORDER_007 until the vendor attached one. */
    FileLinkResponse invoice(CurrentUserInfo caller, String orderId);

    /** FR-44, A-02: the vendor attaches the invoice it issued; a new one replaces the previous. */
    FileLinkResponse attachInvoice(CurrentUserInfo caller, String orderId, AttachFileRequest request);
}
