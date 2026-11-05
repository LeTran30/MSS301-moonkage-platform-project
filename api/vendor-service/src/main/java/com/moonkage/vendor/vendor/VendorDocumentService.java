package com.moonkage.vendor.vendor;

import com.moonkage.storage.BucketAccess;
import com.moonkage.storage.ObjectStorage;
import com.moonkage.storage.PresignedUploadLink;
import com.moonkage.storage.StorageProperties;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.vendor.dto.request.CreateVendorDocumentRequest;
import com.moonkage.vendor.vendor.dto.request.DocumentUploadRequest;
import com.moonkage.vendor.vendor.dto.request.SubmitVendorRequest;
import com.moonkage.vendor.vendor.dto.response.PresignedUploadLinkResponse;
import com.moonkage.vendor.vendor.dto.response.VendorDocumentLinkResponse;
import com.moonkage.vendor.vendor.dto.response.VendorDocumentResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * The files of a vendor: the presigned upload to the private bucket, the check and move of an uploaded file, and the
 * current document of each kind (AC-26.1, AC-27.6).
 *
 * <p>Split out of {@link VendorServiceImpl} because the object storage rules are a whole concern of their own: a file
 * is only accepted when it was uploaded through this service, and it changes key exactly once, when it is attached.
 */
@Component
@RequiredArgsConstructor
class VendorDocumentService {

    // request fields named in errors, so the client shows each error at its field (FR-26)
    private static final String FIELD_KIND = "kind";
    private static final String FIELD_OBJECT_KEY = "objectKey";
    private static final String FIELD_DOCUMENTS = "documents";

    private final ObjectStorage objectStorage;
    private final StorageProperties storageProperties;
    private final VendorDocumentProperties documentProperties;
    private final VendorDocumentRepository documentRepository;

    /** Presigned upload to the private bucket: the file belongs to nothing until it is attached. */
    PresignedUploadLinkResponse createUploadLink(DocumentUploadRequest request) {
        PresignedUploadLink link = objectStorage.createPresignedUploadLink(
                request.contentType(), request.sizeBytes(), documentProperties.toFileLimit());
        return new PresignedUploadLinkResponse(link.tempKey(), link.uploadUrl(), link.formFields(), link.expiresAt());
    }

    /** Short-lived link to one document of the vendor (AC-27.6, NFR-03); call it after the permission check. */
    VendorDocumentLinkResponse createDownloadLink(VendorDocument document) {
        String url = objectStorage.createPresignedDownloadUrl(document.getObjectKey());
        return new VendorDocumentLinkResponse(url, Instant.now().plus(storageProperties.downloadLinkLifetime()));
    }

    /**
     * A new upload (temp key) is checked and moved under the vendor's prefix and becomes the current document of its
     * kind; any other key must be the current document of that kind, which stays. Keys are all checked before the
     * first file moves.
     */
    void attachDocuments(
            String vendorId,
            List<SubmitVendorRequest.Document> requested,
            Map<DocumentKind, VendorDocument> currentByKind) {
        List<SubmitVendorRequest.Document> uploads = new ArrayList<>();
        for (SubmitVendorRequest.Document document : requested) {
            if (objectStorage.isTempKey(document.objectKey())) {
                uploads.add(document);
            } else if (!isCurrent(document, currentByKind)) {
                throw new AppException(ErrorCode.DOCUMENT_NOT_ACCEPTED).atField(FIELD_DOCUMENTS);
            }
        }
        for (SubmitVendorRequest.Document upload : uploads) {
            documentRepository.save(
                    VendorDocument.of(vendorId, upload.kind(), moveDocument(vendorId, upload.objectKey())));
        }
    }

    /** One document of the vendor, or none; the vendor in the path decides which file is meant. */
    Optional<VendorDocument> findByIdAndVendorId(String documentId, String vendorId) {
        return documentRepository.findByIdAndVendorId(documentId, vendorId);
    }

    /** Admin attaches the registration fee invoice of a vendor that paid (Q-36). */
    VendorDocumentResponse attachAdminDocument(Vendor vendor, CreateVendorDocumentRequest request) {
        if (request.kind() != DocumentKind.FEE_INVOICE) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_ACCEPTED).atField(FIELD_KIND);
        }
        if (!vendor.isRegistrationFeePaid()) {
            throw new AppException(ErrorCode.REGISTRATION_FEE_NOT_PAID);
        }
        if (!objectStorage.isTempKey(request.objectKey())) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_ACCEPTED).atField(FIELD_OBJECT_KEY);
        }
        VendorDocument document = documentRepository.save(
                VendorDocument.of(vendor.getId(), request.kind(), moveDocument(vendor.getId(), request.objectKey())));
        return VendorMapper.toDocumentResponse(document);
    }

    /** Checks the uploaded file and moves it under the vendor's prefix; returns its key there. */
    private String moveDocument(String vendorId, String tempKey) {
        return objectStorage.moveUploadedFile(
                tempKey,
                documentProperties.toFileLimit(),
                BucketAccess.PRIVATE,
                documentProperties.keyPrefixOf(vendorId));
    }

    private static boolean isCurrent(
            SubmitVendorRequest.Document document, Map<DocumentKind, VendorDocument> currentByKind) {
        VendorDocument current = currentByKind.get(document.kind());
        return current != null && current.getObjectKey().equals(document.objectKey());
    }

    /** The latest document of each kind (documents are never replaced in place). */
    Map<DocumentKind, VendorDocument> currentDocuments(String vendorId) {
        Map<DocumentKind, VendorDocument> currentByKind = new EnumMap<>(DocumentKind.class);
        for (VendorDocument document : documentRepository.findByVendorIdOrderByUploadedAtAsc(vendorId)) {
            currentByKind.put(document.getKind(), document);
        }
        return currentByKind;
    }
}
