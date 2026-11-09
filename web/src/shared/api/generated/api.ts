/* eslint-disable */
// File này SINH TỰ ĐỘNG — không sửa bằng tay.
//
// Nguồn: OpenAPI của 7 service, hợp nhất bởi `web/scripts/generate-api-types.mjs`.
// Chạy lại script sau khi backend đổi hợp đồng.
export interface paths {
    "/api/accounts/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getMyAccount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/accounts/me/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateMyProfile"];
        trace?: never;
    };
    "/api/addresses": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getMyAddresses"];
        put?: never;
        post: operations["IdentityCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/addresses/{addressId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["IdentityUpdate"];
        post?: never;
        delete: operations["delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/refresh-token": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["refreshToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/reset-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["resetPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/send-reset-password-otp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["sendResetPasswordOtp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/send-verify-account-otp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["sendVerifyAccountOtp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/verify-account": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["verifyAccount"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cake-attributes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Open to guests.
         * @description Open to guests. Without <code>codes</code>: the buyer's filter (AC-06.6) and the seller's picker (AC-29.1), hidden
         *      values admin only. With <code>codes</code>: the labels of those codes, hidden ones included, for a product page
         *      (AC-54.4).
         */
        get: operations["getCakeAttributes"];
        put?: never;
        /**
         * Admin: a new value {group, label}; code and order come from the label (AC-54.1). 409 VENDOR_020 on a
         *      duplicate name.
         * @description Admin: a new value {group, label}; code and order come from the label (AC-54.1). 409 VENDOR_020 on a
         *      duplicate name.
         */
        post: operations["createCakeAttribute"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cake-attributes/{attributeId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Admin: {label?, sortOrder?, active?}; the code never changes.
         * @description Admin: {label?, sortOrder?, active?}; the code never changes. Hiding the last visible value of a group is
         *      409 VENDOR_021 (AC-54.6).
         */
        patch: operations["updateCakeAttribute"];
        trace?: never;
    };
    "/api/carts/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_3"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/carts/me/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["addItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/carts/me/items/{itemId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["removeItem"];
        options?: never;
        head?: never;
        patch: operations["updateItem"];
        trace?: never;
    };
    "/api/chat/conversations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["inbox"];
        put?: never;
        post: operations["start"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/chat/conversations/{conversationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["thread"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/chat/conversations/{conversationId}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["send"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/chat/conversations/{conversationId}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OrderMarkRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/chat/conversations/{conversationId}/typing": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["typing"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/checkouts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/checkouts/{checkoutId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/interprovince-fees": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTable"];
        put: operations["replace"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/interprovince-fees/provinces/{provinceCode}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getProvinceFee"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ledgers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["list_2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ledgers/{orderId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PaymentGet_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ledgers/{orderId}/disbursements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["disbursements"];
        put?: never;
        post: operations["requestDisbursement"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ledgers/{orderId}/disbursements/{requestId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["reviewDisbursement"];
        trace?: never;
    };
    "/api/ledgers/{orderId}/entries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["entries"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ledgers/{orderId}/payout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["payout"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ledgers/{orderId}/refunds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["refunds"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/nfc/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/nfc/sessions/{sessionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getSession"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/nfc/sessions/{sessionId}/card": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["submitCard"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/nfc/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getMyNfcStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrchestratorList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/notifications/{notificationId}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["OrchestratorMarkRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["markAllRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderList_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/orders/{orderId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderGet_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["OrderUpdate"];
        trace?: never;
    };
    "/api/orders/{orderId}/dispute": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderGet"];
        put?: never;
        post: operations["open"];
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["resolve"];
        trace?: never;
    };
    "/api/orders/{orderId}/dispute/evidences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["addEvidence"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/orders/{orderId}/invoice": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["invoice"];
        put: operations["attachInvoice"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/orders/{orderId}/mockups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["mockups"];
        put?: never;
        post: operations["uploadMockup"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/orders/{orderId}/mockups/{versionNo}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["reviewMockup"];
        trace?: never;
    };
    "/api/orders/{orderId}/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["payRemainder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/orders/{orderId}/progress-updates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["progressUpdates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/orders/{orderId}/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["OrderList"];
        put?: never;
        post: operations["OrderCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/orders/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["stats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/orders/uploads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createUploadLink"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PaymentList_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/payments/{paymentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PaymentGet"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/payments/vnpay/ipn": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ipn"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/payments/vnpay/return": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["vnpayReturn"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["search"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/products/{productId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogGetProduct"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/products/{productId}/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogGetReviews"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/products/facets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getFacets"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/quote-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["searchRequests"];
        put?: never;
        post: operations["QuotationCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/quote-requests/{requestId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getRequest"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/quote-requests/{requestId}/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getInvitations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/quote-requests/{requestId}/invitations/{vendorId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateInvitation"];
        trace?: never;
    };
    "/api/quote-requests/{requestId}/quotes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getQuotes"];
        put?: never;
        post: operations["submitQuote"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/quote-requests/{requestId}/quotes/{quoteId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getQuote"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateQuote"];
        trace?: never;
    };
    "/api/quote-requests/{requestId}/quotes/{quoteId}/acceptance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAcceptance"];
        put?: never;
        post: operations["accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/refunds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PaymentList"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/refunds/{refundId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["confirmManual"];
        trace?: never;
    };
    "/api/registration-fee-config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Open to guests: the profile form shows the fee before anyone registers (AC-26.9).
         * @description Open to guests: the profile form shows the fee before anyone registers (AC-26.9).
         */
        get: operations["getCurrentConfig"];
        /**
         * Admin only: a new level from now on (FR-53).
         * @description Admin only: a new level from now on (FR-53).
         */
        put: operations["changeFee"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/suppliers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["searchSuppliers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/suppliers/{vendorId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getSupplier"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * <code>ownerAccountId=me</code>: the caller's own vendor (FR-27).
         * @description <code>ownerAccountId=me</code>: the caller's own vendor (FR-27). <code>status=</code>: admin list to review (FR-45).
         */
        get: operations["searchVendors"];
        put?: never;
        /**
         * FR-26: a member verified by NFC submits a vendor profile with its documents; PENDING until an admin
         *      reviews it.
         * @description FR-26: a member verified by NFC submits a vendor profile with its documents; PENDING until an admin
         *      reviews it.
         */
        post: operations["submit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors/{vendorId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Owner or admin: profile, status, reason, canOperate (FR-27); the admin also sees the owner checks.
         * @description Owner or admin: profile, status, reason, canOperate (FR-27); the admin also sees the owner checks.
         */
        get: operations["getVendor"];
        /**
         * Allowed only while NEEDS_INFO or REJECTED (AC-27.2).
         * @description Allowed only while NEEDS_INFO or REJECTED (AC-27.2).
         */
        put: operations["resubmit"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Owner: {localDeliveryFee} (FR-28).
         * @description Owner: {localDeliveryFee} (FR-28). Admin: {status: LOCKED, statusReason} (FR-46).
         */
        patch: operations["VendorUpdate"];
        trace?: never;
    };
    "/api/vendors/{vendorId}/delivery-areas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Owner: province codes the vendor delivers to (FR-28).
         * @description Owner: province codes the vendor delivers to (FR-28).
         */
        get: operations["getDeliveryAreas"];
        /**
         * Owner: replaces the delivery areas; at least one province (FR-28).
         * @description Owner: replaces the delivery areas; at least one province (FR-28).
         */
        put: operations["saveDeliveryAreas"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors/{vendorId}/documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Admin: attaches the registration fee invoice (kind FEE_INVOICE, Q-36).
         * @description Admin: attaches the registration fee invoice (kind FEE_INVOICE, Q-36).
         */
        post: operations["createDocument"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors/{vendorId}/documents/{documentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Owner or admin: a short-lived link to a private document (AC-27.6, NFR-03).
         * @description Owner or admin: a short-lived link to a private document (AC-27.6, NFR-03).
         */
        get: operations["getDocumentLink"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors/{vendorId}/order-profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Owner: the order profile (FR-35); 404 VENDOR_016 when none yet.
         * @description Owner: the order profile (FR-35); 404 VENDOR_016 when none yet.
         */
        get: operations["getOrderProfile"];
        /**
         * Owner: the whole order profile again (FR-35); the terms required depend on the supply source.
         * @description Owner: the whole order profile again (FR-35); the terms required depend on the supply source.
         */
        put: operations["saveOrderProfile"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors/{vendorId}/owner-checks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Admin: how the owner matched the representative at each submission (AC-45.4).
         * @description Admin: how the owner matched the representative at each submission (AC-45.4).
         */
        get: operations["getOwnerChecks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors/{vendorId}/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * The Shop's products, every status, newest first.
         * @description The Shop's products, every status, newest first. Owner or admin.
         */
        get: operations["getProducts"];
        put?: never;
        /**
         * FR-29: a new product, on sale at once (BR-24).
         * @description FR-29: a new product, on sale at once (BR-24). The Shop must be approved, paid up and selling in the Shop; at
         *      least one image, one crust and one filling; brand and origin when resold.
         */
        post: operations["createProduct"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors/{vendorId}/products/{productId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * One product as its Shop sees it, with the version to send back on PUT.
         * @description One product as its Shop sees it, with the version to send back on PUT. Owner or admin.
         */
        get: operations["VendorGetProduct"];
        /**
         * FR-30, FR-32, FR-33: the whole product again, with the version read before editing (409 VENDOR_027 when
         *      someone changed it since, a sale included).
         * @description FR-30, FR-32, FR-33: the whole product again, with the version read before editing (409 VENDOR_027 when
         *      someone changed it since, a sale included).
         */
        put: operations["replaceProduct"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Owner: {status: ON_SALE | HIDDEN} (FR-34).
         * @description Owner: {status: ON_SALE | HIDDEN} (FR-34). Admin: {status: REMOVED, removedReason}, for good (FR-46).
         */
        patch: operations["updateProduct"];
        trace?: never;
    };
    "/api/vendors/{vendorId}/products/uploads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Step 1 of an image upload (FR-29): send the file to uploadUrl, then its tempKey among imageKeys.
         * @description Step 1 of an image upload (FR-29): send the file to uploadUrl, then its tempKey among imageKeys.
         */
        post: operations["createImageUploadLink"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors/{vendorId}/registration-fee-payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Owner or admin: registration fee payments made (AC-53.3).
         * @description Owner or admin: registration fee payments made (AC-53.3).
         */
        get: operations["getRegistrationFeePayments"];
        put?: never;
        /**
         * Charges the fee in effect now (AC-53.3).
         * @description Charges the fee in effect now (AC-53.3).
         */
        post: operations["createRegistrationFeePayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors/{vendorId}/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Admin: past review decisions, oldest first (AC-45.5).
         * @description Admin: past review decisions, oldest first (AC-45.5).
         */
        get: operations["VendorGetReviews"];
        put?: never;
        /**
         * Creating a review moves the vendor to the decided status (AC-45.2 - AC-45.5).
         * @description Creating a review moves the vendor to the decided status (AC-45.2 - AC-45.5).
         */
        post: operations["createReview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors/{vendorId}/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Open to guests (B-3.2): the public summary of a shop, so a buyer can see the province of the shop they are
         *      looking at. Only the safe fields of {@link VendorSummaryResponse VendorSummaryResponse} are exposed; the private profile keeps its
         *      owner-and-admin check above.
         * @description Open to guests (B-3.2): the public summary of a shop, so a buyer can see the province of the shop they are
         *      looking at. Only the safe fields of {@link VendorSummaryResponse VendorSummaryResponse} are exposed; the private profile keeps its
         *      owner-and-admin check above.
         */
        get: operations["getVendorSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vendors/uploads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Upload a legal document straight to MinIO: POST formFields and the file to uploadUrl, then send tempKey as a
         *      document's objectKey when submitting the profile (AC-26.1).
         * @description Upload a legal document straight to MinIO: POST formFields and the file to uploadUrl, then send tempKey as a
         *      document's objectKey when submitting the profile (AC-26.1).
         */
        post: operations["createDocumentUploadLink"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/internal/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PaymentCreate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/internal/refunds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["request"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AcceptanceResponse: {
            /** Format: date-time */
            acceptedAt?: string;
            contentHash?: string;
            /** Format: int64 */
            depositAmount?: number;
            id?: string;
            /** Format: date-time */
            paidAt?: string;
            /** Format: date-time */
            paymentExpiresAt?: string;
            quoteId?: string;
            requestId?: string;
            snapshot?: string;
            /** @enum {string} */
            status?: "PENDING_PAYMENT" | "SUCCEEDED" | "FAILED" | "EXPIRED";
        };
        AcceptQuoteRequest: {
            invoiceInfo?: components["schemas"]["InvoiceInfoRequest"];
        };
        AcceptQuoteResponse: {
            acceptanceId?: string;
            /** Format: int64 */
            depositAmount?: number;
            /** Format: date-time */
            paymentExpiresAt?: string;
            paymentId?: string;
            paymentUrl?: string;
            /** @enum {string} */
            status?: "PENDING_PAYMENT" | "SUCCEEDED" | "FAILED" | "EXPIRED";
        };
        AccountResponse: {
            accountId?: string;
            email?: string;
            fullName?: string;
            phoneNumber?: string;
            /** @enum {string} */
            role?: "MEMBER" | "ADMIN";
        };
        AddAddressRequest: {
            detail: string;
            isDefault?: boolean;
            label?: string;
            provinceCode: string;
            provinceName: string;
            recipientName: string;
            recipientPhone: string;
            wardName: string;
        };
        AddAddressResponse: {
            areaCode?: string;
            /** Format: date-time */
            createdAt?: string;
            detail?: string;
            fullAddress?: string;
            id?: string;
            isDefault?: boolean;
            label?: string;
            provinceCode?: string;
            provinceName?: string;
            recipientName?: string;
            recipientPhone?: string;
            /** Format: date-time */
            updatedAt?: string;
            wardName?: string;
        };
        AddCartItemRequest: {
            productId: string;
            /** Format: int32 */
            quantity?: number;
        };
        AllocationRequest: {
            /** Format: int64 */
            amount?: number;
            orderId: string;
        };
        ApiResponseAcceptanceResponse: {
            code?: string;
            data?: components["schemas"]["AcceptanceResponse"];
            errors?: components["schemas"]["QuotationFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseAcceptQuoteResponse: {
            code?: string;
            data?: components["schemas"]["AcceptQuoteResponse"];
            errors?: components["schemas"]["QuotationFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseAccountResponse: {
            code?: string;
            data?: components["schemas"]["AccountResponse"];
            errors?: components["schemas"]["FieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseAddAddressResponse: {
            code?: string;
            data?: components["schemas"]["AddAddressResponse"];
            errors?: components["schemas"]["FieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseCakeAttributeResponse: {
            code?: string;
            data?: components["schemas"]["CakeAttributeResponse"];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseCartResponse: {
            code?: string;
            data?: components["schemas"]["CartResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseChatMessageResponse: {
            code?: string;
            data?: components["schemas"]["ChatMessageResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseChatThreadResponse: {
            code?: string;
            data?: components["schemas"]["ChatThreadResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseCheckoutResponse: {
            code?: string;
            data?: components["schemas"]["CheckoutResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseConversationResponse: {
            code?: string;
            data?: components["schemas"]["ConversationResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseCreateCheckoutResponse: {
            code?: string;
            data?: components["schemas"]["CreateCheckoutResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseCreateNfcSessionResponse: {
            code?: string;
            data?: components["schemas"]["CreateNfcSessionResponse"];
            errors?: components["schemas"]["FieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseDisbursementResponse: {
            code?: string;
            data?: components["schemas"]["DisbursementResponse"];
            errors?: components["schemas"]["PaymentFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseDisputeResponse: {
            code?: string;
            data?: components["schemas"]["DisputeResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseFileLinkResponse: {
            code?: string;
            data?: components["schemas"]["FileLinkResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseInterprovinceFeeResponse: {
            code?: string;
            data?: components["schemas"]["InterprovinceFeeResponse"];
            errors?: components["schemas"]["CatalogFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseInterprovinceFeeTableResponse: {
            code?: string;
            data?: components["schemas"]["InterprovinceFeeTableResponse"];
            errors?: components["schemas"]["CatalogFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseInvitationResponse: {
            code?: string;
            data?: components["schemas"]["InvitationResponse"];
            errors?: components["schemas"]["QuotationFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseLedgerResponse: {
            code?: string;
            data?: components["schemas"]["LedgerResponse"];
            errors?: components["schemas"]["PaymentFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseLine: {
            code?: string;
            data?: components["schemas"]["Line"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListAddAddressResponse: {
            code?: string;
            data?: components["schemas"]["AddAddressResponse"][];
            errors?: components["schemas"]["FieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListCakeAttributeResponse: {
            code?: string;
            data?: components["schemas"]["CakeAttributeResponse"][];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListConversationResponse: {
            code?: string;
            data?: components["schemas"]["ConversationResponse"][];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListDisbursementResponse: {
            code?: string;
            data?: components["schemas"]["DisbursementResponse"][];
            errors?: components["schemas"]["PaymentFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListInvitationResponse: {
            code?: string;
            data?: components["schemas"]["InvitationResponse"][];
            errors?: components["schemas"]["QuotationFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListLedgerEntryResponse: {
            code?: string;
            data?: components["schemas"]["LedgerEntryResponse"][];
            errors?: components["schemas"]["PaymentFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListMockupResponse: {
            code?: string;
            data?: components["schemas"]["MockupResponse"][];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListOwnerCheckResponse: {
            code?: string;
            data?: components["schemas"]["OwnerCheckResponse"][];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListProductResponse: {
            code?: string;
            data?: components["schemas"]["ProductResponse"][];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListProgressUpdateResponse: {
            code?: string;
            data?: components["schemas"]["ProgressUpdateResponse"][];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListQuoteRequestResponse: {
            code?: string;
            data?: components["schemas"]["QuoteRequestResponse"][];
            errors?: components["schemas"]["QuotationFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListQuoteResponse: {
            code?: string;
            data?: components["schemas"]["QuoteResponse"][];
            errors?: components["schemas"]["QuotationFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListRefundResponse: {
            code?: string;
            data?: components["schemas"]["RefundResponse"][];
            errors?: components["schemas"]["PaymentFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListRegistrationFeePaymentResponse: {
            code?: string;
            data?: components["schemas"]["RegistrationFeePaymentResponse"][];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListReviewResponse: {
            code?: string;
            data?: components["schemas"]["ReviewResponse"][];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListString: {
            code?: string;
            data?: string[];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListSupplierResponse: {
            code?: string;
            data?: components["schemas"]["SupplierResponse"][];
            errors?: components["schemas"]["QuotationFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListVendorResponse: {
            code?: string;
            data?: components["schemas"]["VendorResponse"][];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseListVendorReviewResponse: {
            code?: string;
            data?: components["schemas"]["VendorReviewResponse"][];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseLoginResponse: {
            code?: string;
            data?: components["schemas"]["LoginResponse"];
            errors?: components["schemas"]["FieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseLong: {
            code?: string;
            /** Format: int64 */
            data?: number;
            errors?: components["schemas"]["OrchestratorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseMockupResponse: {
            code?: string;
            data?: components["schemas"]["MockupResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseNfcSessionStatusResponse: {
            code?: string;
            data?: components["schemas"]["NfcSessionStatusResponse"];
            errors?: components["schemas"]["FieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseNfcStatusResponse: {
            code?: string;
            data?: components["schemas"]["NfcStatusResponse"];
            errors?: components["schemas"]["FieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseNotificationPageResponse: {
            code?: string;
            data?: components["schemas"]["NotificationPageResponse"];
            errors?: components["schemas"]["OrchestratorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseNotificationResponse: {
            code?: string;
            data?: components["schemas"]["NotificationResponse"];
            errors?: components["schemas"]["OrchestratorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseOrderProfileResponse: {
            code?: string;
            data?: components["schemas"]["OrderProfileResponse"];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseOrderResponse: {
            code?: string;
            data?: components["schemas"]["OrderResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseOrderStatsResponse: {
            code?: string;
            data?: components["schemas"]["OrderStatsResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponsePageResponseLedgerResponse: {
            code?: string;
            data?: components["schemas"]["PageResponseLedgerResponse"];
            errors?: components["schemas"]["PaymentFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponsePageResponseOrderResponse: {
            code?: string;
            data?: components["schemas"]["PageResponseOrderResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponsePageResponsePaymentResponse: {
            code?: string;
            data?: components["schemas"]["PageResponsePaymentResponse"];
            errors?: components["schemas"]["PaymentFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponsePageResponseProductListingResponse: {
            code?: string;
            data?: components["schemas"]["PageResponseProductListingResponse"];
            errors?: components["schemas"]["CatalogFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponsePageResponseProductReviewResponse: {
            code?: string;
            data?: components["schemas"]["PageResponseProductReviewResponse"];
            errors?: components["schemas"]["CatalogFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponsePageResponseRefundResponse: {
            code?: string;
            data?: components["schemas"]["PageResponseRefundResponse"];
            errors?: components["schemas"]["PaymentFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponsePaymentLinkResponse: {
            code?: string;
            data?: components["schemas"]["PaymentLinkResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponsePaymentResponse: {
            code?: string;
            data?: components["schemas"]["PaymentResponse"];
            errors?: components["schemas"]["PaymentFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponsePayoutResponse: {
            code?: string;
            data?: components["schemas"]["PayoutResponse"];
            errors?: components["schemas"]["PaymentFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponsePresignedUploadLinkResponse: {
            code?: string;
            data?: components["schemas"]["PresignedUploadLinkResponse"];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseProductFacetsResponse: {
            code?: string;
            data?: components["schemas"]["ProductFacetsResponse"];
            errors?: components["schemas"]["CatalogFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseProductListingResponse: {
            code?: string;
            data?: components["schemas"]["ProductListingResponse"];
            errors?: components["schemas"]["CatalogFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseProductResponse: {
            code?: string;
            data?: components["schemas"]["ProductResponse"];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseQuoteRequestResponse: {
            code?: string;
            data?: components["schemas"]["QuoteRequestResponse"];
            errors?: components["schemas"]["QuotationFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseQuoteResponse: {
            code?: string;
            data?: components["schemas"]["QuoteResponse"];
            errors?: components["schemas"]["QuotationFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseRefundResponse: {
            code?: string;
            data?: components["schemas"]["RefundResponse"];
            errors?: components["schemas"]["PaymentFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseRegisterAccountResponse: {
            code?: string;
            data?: components["schemas"]["RegisterAccountResponse"];
            errors?: components["schemas"]["FieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseRegistrationFeeConfigResponse: {
            code?: string;
            data?: components["schemas"]["RegistrationFeeConfigResponse"];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseRegistrationFeePaymentLinkResponse: {
            code?: string;
            data?: components["schemas"]["RegistrationFeePaymentLinkResponse"];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseReviewResponse: {
            code?: string;
            data?: components["schemas"]["ReviewResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseSubmitCardResponse: {
            code?: string;
            data?: components["schemas"]["SubmitCardResponse"];
            errors?: components["schemas"]["FieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseSupplierResponse: {
            code?: string;
            data?: components["schemas"]["SupplierResponse"];
            errors?: components["schemas"]["QuotationFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseVendorDetailResponse: {
            code?: string;
            data?: components["schemas"]["VendorDetailResponse"];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseVendorDocumentLinkResponse: {
            code?: string;
            data?: components["schemas"]["VendorDocumentLinkResponse"];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseVendorDocumentResponse: {
            code?: string;
            data?: components["schemas"]["VendorDocumentResponse"];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseVendorReviewResponse: {
            code?: string;
            data?: components["schemas"]["VendorReviewResponse"];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseVendorSummaryResponse: {
            code?: string;
            data?: components["schemas"]["VendorSummaryResponse"];
            errors?: components["schemas"]["VendorFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseVerifyAccountResponse: {
            code?: string;
            data?: components["schemas"]["VerifyAccountResponse"];
            errors?: components["schemas"]["FieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        ApiResponseVoid: {
            code?: string;
            data?: unknown;
            errors?: components["schemas"]["FieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        AttachFileRequest: {
            tempKey: string;
        };
        BankAccount: {
            bankName?: string;
            holder?: string;
            maskedNumber?: string;
        };
        /** @description One crust or filling of the catalogue (FR-54). */
        CakeAttributeResponse: {
            active?: boolean;
            code?: string;
            /** @enum {string} */
            group?: "CRUST" | "FILLING";
            id?: string;
            label?: string;
            /** Format: int32 */
            sortOrder?: number;
        };
        CartResponse: {
            groups?: components["schemas"]["Group"][];
            provinceCode?: string;
            /** Format: int64 */
            totalAmount?: number;
        };
        CatalogFieldError: {
            field?: string;
            message?: string;
        };
        ChangeRegistrationFeeRequest: {
            /**
             * Format: int64
             * @description whole VND, more than 0; checked by <code>Price</code>, the error names this field
             */
            amount?: number;
        };
        ChatMessageResponse: {
            attachmentContentType?: string;
            attachmentName?: string;
            attachmentUrl?: string;
            body?: string;
            conversationId?: string;
            /** Format: date-time */
            createdAt?: string;
            id?: string;
            senderAccountId?: string;
            senderParty?: string;
            /** Format: int64 */
            seq?: number;
        };
        ChatThreadResponse: {
            /** Format: int64 */
            buyerReadSeq?: number;
            conversationId?: string;
            hasMore?: boolean;
            messages?: components["schemas"]["ChatMessageResponse"][];
            myParty?: string;
            /** Format: int64 */
            vendorReadSeq?: number;
        };
        CheckoutResponse: {
            checkoutId?: string;
            /** Format: date-time */
            expiresAt?: string;
            orderIds?: string[];
            paymentId?: string;
            /** @enum {string} */
            status?: "PENDING_PAYMENT" | "SUCCEEDED" | "FAILED" | "EXPIRED" | "REFUND_REQUESTED";
            /** Format: int64 */
            totalAmount?: number;
        };
        CodeCount: {
            /** Format: int64 */
            count?: number;
            value?: string;
        };
        ConversationResponse: {
            buyerAccountId?: string;
            buyerName?: string;
            id?: string;
            lastMessage?: components["schemas"]["ChatMessageResponse"];
            /** Format: date-time */
            lastMessageAt?: string;
            myParty?: string;
            /** Format: int64 */
            unreadCount?: number;
            vendorId?: string;
            vendorName?: string;
        };
        /** @description A new crust or filling (AC-54.1); the code and the position are given by the service. */
        CreateCakeAttributeRequest: {
            /** @enum {string} */
            group: "CRUST" | "FILLING";
            /** @description the name shown to sellers and buyers, checked by CakeAttributeLabel */
            label?: string;
        };
        CreateCheckoutRequest: {
            addressDetail: string;
            invoiceInfo?: components["schemas"]["OrderInvoiceInfoRequest"];
            provinceCode: string;
            recipientName: string;
            recipientPhone: string;
        };
        CreateCheckoutResponse: {
            checkoutId?: string;
            /** Format: date-time */
            expiresAt?: string;
            paymentId?: string;
            paymentUrl?: string;
            /** Format: int64 */
            totalAmount?: number;
        };
        CreateDisbursementRequest: {
            /** Format: int64 */
            amount?: number;
            /** @enum {string} */
            purpose: "MATERIALS" | "PRINTING" | "PACKAGING" | "RESTOCK";
        };
        CreateNfcSessionResponse: {
            /** Format: date-time */
            expiresAt?: string;
            sessionId?: string;
        };
        CreatePaymentRequest: {
            allocations?: components["schemas"]["AllocationRequest"][];
            /** Format: int64 */
            amount?: number;
            /** Format: date-time */
            expiresAt?: string;
            payerAccountId: string;
            /** @enum {string} */
            purpose: "CHECKOUT" | "DEPOSIT" | "REMAINDER" | "REGISTRATION_FEE";
            referenceId: string;
        };
        CreatePaymentResponse: {
            paymentId?: string;
            paymentUrl?: string;
        };
        CreateQuoteRequestRequest: {
            /** Format: int64 */
            budget?: number;
            customSpec?: string;
            customTypes?: ("BAG" | "CARD" | "STICKER" | "TEMPLATE_BOX")[];
            delivery: components["schemas"]["DeliveryAddressRequest"];
            /** Format: date */
            deliveryDeadline: string;
            productId?: string;
            /** Format: int32 */
            quantity: number;
            targetVendorId?: string;
            /** @enum {string} */
            type: "DIRECT" | "OPEN";
        };
        CreateReviewRequest: {
            content?: string;
            productId: string;
            /** Format: int32 */
            rating?: number;
        };
        /** @description Admin attaches the registration fee invoice once the fee is paid (Q-36, AC-27.6). */
        CreateVendorDocumentRequest: {
            /**
             * @description only FEE_INVOICE; the owner's documents come with the profile
             * @enum {string}
             */
            kind: "BUSINESS_LICENSE" | "FOOD_SAFETY" | "FEE_INVOICE";
            /** @description tempKey from POST /api/vendors/uploads */
            objectKey: string;
        };
        /** @description An admin's decision on a pending profile (FR-45). */
        CreateVendorReviewRequest: {
            /** @enum {string} */
            decision: "APPROVE" | "NEEDS_INFO" | "REJECT";
            /**
             * @description required to approve: unit name, code, representative name and ID number compared with the
             *          licence file (AC-45.5)
             */
            licenseChecked?: boolean;
            /** @description required unless <code>decision = APPROVE</code> (AC-45.2) */
            reason?: string;
            /**
             * @description required to approve a sole proprietorship: enterprise code looked up on the national
             *          business registration portal (AC-45.5, A-14)
             */
            registryChecked?: boolean;
        };
        CurrentUserInfo: {
            accountId?: string;
            email?: string;
            /** @enum {string} */
            role?: "MEMBER" | "ADMIN";
        };
        CustomItemRequest: {
            /** @enum {string} */
            customType: "BAG" | "CARD" | "STICKER" | "TEMPLATE_BOX";
            description: string;
            /** Format: int32 */
            quantity: number;
            /** Format: int64 */
            unitPrice: number;
        };
        DailyPoint: {
            /** Format: date */
            date?: string;
            /** Format: int64 */
            orderCount?: number;
            /** Format: int64 */
            revenue?: number;
        };
        DeliveryAddressRequest: {
            addressDetail: string;
            provinceCode: string;
            recipientName: string;
            recipientPhone: string;
        };
        DeliveryAddressResponse: {
            addressDetail?: string;
            provinceCode?: string;
            recipientName?: string;
            recipientPhone?: string;
        };
        DisbursementResponse: {
            /** Format: int64 */
            amount?: number;
            /** Format: int64 */
            approvedAmount?: number;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            decidedAt?: string;
            orderId?: string;
            /** @enum {string} */
            purpose?: "MATERIALS" | "PRINTING" | "PACKAGING" | "RESTOCK";
            reason?: string;
            requestId?: string;
            /** @enum {string} */
            status?: "PENDING" | "APPROVED" | "REJECTED";
        };
        DisputeResponse: {
            /** Format: date-time */
            createdAt?: string;
            /** @enum {string} */
            decision?: "FULL_REFUND" | "PARTIAL_REFUND" | "REJECTED";
            decisionReason?: string;
            description?: string;
            disputeId?: string;
            evidences?: components["schemas"]["Evidence"][];
            orderId?: string;
            /** @enum {string} */
            reason?: "WRONG_ITEM" | "DAMAGED" | "LATE_DELIVERY" | "WRONG_LOGO" | "OTHER";
            /** Format: int64 */
            refundAmount?: number;
            /** Format: date-time */
            resolvedAt?: string;
            /** @enum {string} */
            status?: "OPEN" | "RESOLVED";
        };
        Document: {
            /** @enum {string} */
            kind: "BUSINESS_LICENSE" | "FOOD_SAFETY" | "FEE_INVOICE";
            /**
             * @description tempKey from POST /api/vendors/uploads, or, when resubmitting, the key of a current document
             *          of the same kind that stays as it is
             */
            objectKey: string;
        };
        /**
         * @description Step 1 of a document upload: what the client is about to send. The signed upload only accepts this type and at
         *      most sizeBytes; both are checked again when the profile is submitted.
         */
        DocumentUploadRequest: {
            contentType: string;
            /** Format: int64 */
            sizeBytes?: number;
        };
        Evidence: {
            /** Format: date-time */
            createdAt?: string;
            downloadUrl?: string;
            note?: string;
            /** @enum {string} */
            party?: "BUYER" | "VENDOR";
        };
        EvidenceRequest: {
            note?: string;
            tempKey: string;
        };
        Fee: {
            /** Format: int64 */
            fee: number;
            provinceCode: string;
        };
        FieldError: {
            field?: string;
            message?: string;
        };
        FileLinkResponse: {
            downloadUrl?: string;
        };
        FileUploadRequest: {
            contentType: string;
            /** Format: int64 */
            sizeBytes?: number;
        };
        Group: {
            deliverable?: boolean;
            interprovince?: boolean;
            items?: components["schemas"]["Line"][];
            /** Format: int64 */
            shippingFee?: number;
            /** Format: int64 */
            subtotal?: number;
            vendorId?: string;
            vendorName?: string;
        };
        /** @description <code>key</code> is what a replace sends back to keep the image; <code>url</code> shows it. */
        Image: {
            key?: string;
            url?: string;
        };
        InterprovinceFeeResponse: {
            /** Format: date-time */
            effectiveFrom?: string;
            /** Format: int64 */
            fee?: number;
            provinceCode?: string;
            provinceName?: string;
        };
        InterprovinceFeeTableResponse: {
            complete?: boolean;
            fees?: components["schemas"]["InterprovinceFeeResponse"][];
        };
        InvitationResponse: {
            declineReason?: string;
            /** Format: date-time */
            respondedAt?: string;
            /** @enum {string} */
            status?: "PENDING" | "QUOTED" | "DECLINED";
            vendorId?: string;
            vendorName?: string;
        };
        InvoiceInfoRequest: {
            address: string;
            /** Format: email */
            email: string;
            name: string;
            taxCode: string;
        };
        InvoiceInfoResponse: {
            address?: string;
            email?: string;
            name?: string;
            taxCode?: string;
        };
        Item: {
            imageUrl?: string;
            productId?: string;
            productName?: string;
            /** Format: int32 */
            quantity?: number;
            /** Format: int64 */
            subtotal?: number;
            /** Format: int64 */
            unitPrice?: number;
        };
        JsonNode: unknown;
        LedgerEntryResponse: {
            actorAccountId?: string;
            /** Format: int64 */
            amount?: number;
            /** Format: date-time */
            createdAt?: string;
            /** @enum {string} */
            kind?: "COLLECT" | "DISBURSE" | "REFUND" | "PAYOUT";
            referenceId?: string;
        };
        LedgerResponse: {
            /** Format: int64 */
            disbursed?: number;
            disputeOpen?: boolean;
            /** Format: date */
            expectedPayoutDate?: string;
            /** Format: int64 */
            held?: number;
            kind?: string;
            orderId?: string;
            orderStatus?: string;
            /** Format: int64 */
            paidOut?: number;
            payable?: boolean;
            /** Format: int64 */
            refunded?: number;
            /** Format: int64 */
            toReceive?: number;
            /** Format: int64 */
            totalCollected?: number;
            vendorId?: string;
        };
        Line: {
            available?: boolean;
            itemId?: string;
            productId?: string;
            productName?: string;
            /** Format: int32 */
            quantity?: number;
            /** Format: int64 */
            unitPrice?: number;
        };
        LoginRequest: {
            password: string;
            username: string;
        };
        LoginResponse: {
            accountId?: string;
            email?: string;
            fullName?: string;
            phoneNumber?: string;
            refreshToken?: string;
            /** @enum {string} */
            role?: "MEMBER" | "ADMIN";
            token?: string;
        };
        MarkChatReadRequest: {
            /** Format: int64 */
            upToSeq?: number;
        };
        MockupResponse: {
            downloadUrl?: string;
            /** Format: date-time */
            reviewedAt?: string;
            reviewNote?: string;
            /** @enum {string} */
            reviewStatus?: "PENDING_REVIEW" | "APPROVED" | "CHANGES_REQUESTED";
            /** Format: date-time */
            uploadedAt?: string;
            /** Format: int32 */
            versionNo?: number;
        };
        NfcSessionStatusResponse: {
            /** Format: date-time */
            expiresAt?: string;
            sessionId?: string;
            /** @enum {string} */
            status?: "PENDING" | "VERIFIED";
        };
        NfcStatusResponse: {
            idNumberMasked?: string;
            legalName?: string;
            /** @enum {string} */
            nfcStatus?: "NOT_VERIFIED" | "VERIFIED" | "LOCKED";
            /** Format: date-time */
            nfcVerifiedAt?: string;
        };
        NotificationPageResponse: {
            content?: components["schemas"]["NotificationResponse"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            totalElements?: number;
            /** Format: int32 */
            totalPages?: number;
            /** Format: int64 */
            unread?: number;
        };
        NotificationResponse: {
            content?: string;
            /** Format: date-time */
            createdAt?: string;
            id?: string;
            read?: boolean;
            targetUrl?: string;
            title?: string;
            type?: string;
        };
        OpenDisputeRequest: {
            description: string;
            evidences?: components["schemas"]["EvidenceRequest"][];
            /** @enum {string} */
            reason: "WRONG_ITEM" | "DAMAGED" | "LATE_DELIVERY" | "WRONG_LOGO" | "OTHER";
        };
        OrchestratorFieldError: {
            field?: string;
            message?: string;
        };
        OrderApiResponsePresignedUploadLinkResponse: {
            code?: string;
            data?: components["schemas"]["OrderPresignedUploadLinkResponse"];
            errors?: components["schemas"]["OrderFieldError"][];
            message?: string;
            path?: string;
            /** Format: int32 */
            status?: number;
            /** Format: date-time */
            timestamp?: string;
        };
        OrderFieldError: {
            field?: string;
            message?: string;
        };
        OrderInvoiceInfoRequest: {
            address: string;
            /** Format: email */
            email: string;
            name: string;
            taxCode: string;
        };
        OrderPresignedUploadLinkResponse: {
            /** Format: date-time */
            expiresAt?: string;
            formFields?: {
                [key: string]: string;
            };
            tempKey?: string;
            uploadUrl?: string;
        };
        /** @description A vendor's order profile (FR-35); price tiers ordered by fromQty. */
        OrderProfileResponse: {
            /** @description codes of the FR-54 catalogue in the admin's order; labels come from GET /api/cake-attributes */
            crustCodes?: string[];
            customTypes?: ("BAG" | "CARD" | "STICKER" | "TEMPLATE_BOX")[];
            distributedBrands?: string;
            earlyBirdOffer?: string;
            fillingCodes?: string[];
            /** Format: int32 */
            gatherableQty?: number;
            /** Format: int32 */
            leadTimeDays?: number;
            logoPrinting?: boolean;
            /** Format: int32 */
            minQty?: number;
            packagingTypes?: string;
            priceTiers?: components["schemas"]["PriceTier"][];
            /** Format: date-time */
            updatedAt?: string;
            /** Format: int32 */
            weeklyCapacity?: number;
        };
        OrderResponse: {
            addressDetail?: string;
            buyerAccountId?: string;
            /** Format: date-time */
            complaintDeadline?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            deliveredAt?: string;
            /** Format: date */
            deliveryDate?: string;
            deliveryMethod?: string;
            /** Format: int64 */
            depositAmount?: number;
            /** Format: int64 */
            discountAmount?: number;
            hasCustom?: boolean;
            hasInvoiceFile?: boolean;
            id?: string;
            interprovince?: boolean;
            invoiceInfo?: components["schemas"]["InvoiceInfoResponse"];
            items?: components["schemas"]["Item"][];
            /** Format: int64 */
            itemsAmount?: number;
            /** @enum {string} */
            kind?: "BUY_NOW" | "CUSTOM_ORDER";
            paymentGroupId?: string;
            provinceCode?: string;
            quoteId?: string;
            /** Format: date-time */
            receivedConfirmedAt?: string;
            recipientName?: string;
            recipientPhone?: string;
            /** Format: int64 */
            remainingAmount?: number;
            /** Format: int64 */
            shippingFee?: number;
            /** @enum {string} */
            status?: "PAID" | "CONFIRMED" | "SHIPPING" | "DEPOSITED" | "AWAITING_MOCKUP_APPROVAL" | "IN_PRODUCTION" | "READY_TO_SHIP" | "DELIVERED" | "COMPLETED";
            /** Format: int64 */
            totalAmount?: number;
            trackingCode?: string;
            vendorId?: string;
            vendorName?: string;
        };
        OrderStatsResponse: {
            byStatus?: components["schemas"]["StatusCount"][];
            daily?: components["schemas"]["DailyPoint"][];
            /** Format: date */
            from?: string;
            /** Format: date */
            to?: string;
            topProducts?: components["schemas"]["TopProduct"][];
            topVendors?: components["schemas"]["TopVendor"][];
            totals?: components["schemas"]["Totals"];
            vendorId?: string;
        };
        /**
         * @description Owner check of one submission (AC-26.8, AC-45.4): the owner's verified ID card at that time and how the declared
         *      representative compares with it. A MISMATCH name is shown to the admin as a warning.
         */
        OwnerCheckResponse: {
            /** Format: date-time */
            checkedAt?: string;
            idMatch?: boolean;
            /** @enum {string} */
            nameMatch?: "MATCH" | "MISMATCH";
            /** Format: date-time */
            nfcVerifiedAt?: string;
            ownerIdMasked?: string;
            ownerLegalName?: string;
            /** Format: int32 */
            submissionNo?: number;
        };
        PageResponseLedgerResponse: {
            content?: components["schemas"]["LedgerResponse"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            totalElements?: number;
            /** Format: int32 */
            totalPages?: number;
        };
        PageResponseOrderResponse: {
            content?: components["schemas"]["OrderResponse"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            totalElements?: number;
            /** Format: int32 */
            totalPages?: number;
        };
        PageResponsePaymentResponse: {
            content?: components["schemas"]["PaymentResponse"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            totalElements?: number;
            /** Format: int32 */
            totalPages?: number;
        };
        PageResponseProductListingResponse: {
            content?: components["schemas"]["ProductListingResponse"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            totalElements?: number;
            /** Format: int32 */
            totalPages?: number;
        };
        PageResponseProductReviewResponse: {
            content?: components["schemas"]["ProductReviewResponse"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            totalElements?: number;
            /** Format: int32 */
            totalPages?: number;
        };
        PageResponseRefundResponse: {
            content?: components["schemas"]["RefundResponse"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            totalElements?: number;
            /** Format: int32 */
            totalPages?: number;
        };
        PaymentFieldError: {
            field?: string;
            message?: string;
        };
        PaymentLinkResponse: {
            paymentId?: string;
            paymentUrl?: string;
        };
        PaymentResponse: {
            /** Format: int64 */
            amount?: number;
            /** Format: date-time */
            expiresAt?: string;
            gatewayResponseCode?: string;
            /** Format: date-time */
            paidAt?: string;
            paymentId?: string;
            /** @enum {string} */
            purpose?: "CHECKOUT" | "DEPOSIT" | "REMAINDER" | "REGISTRATION_FEE";
            referenceId?: string;
            /** @enum {string} */
            status?: "PENDING" | "SUCCEEDED" | "FAILED" | "DUPLICATE";
        };
        PayoutResponse: {
            /** Format: int64 */
            amount?: number;
            /** Format: date-time */
            createdAt?: string;
            orderId?: string;
            payoutId?: string;
            vendorId?: string;
        };
        /**
         * @description Before expiresAt, send a multipart/form-data POST to uploadUrl with every formFields entry as a field, then the
         *      file as the last field named "file". Then send tempKey as a document's objectKey when submitting the profile.
         */
        PresignedUploadLinkResponse: {
            /** Format: date-time */
            expiresAt?: string;
            formFields?: {
                [key: string]: string;
            };
            tempKey?: string;
            uploadUrl?: string;
        };
        /** @description From fromQty pieces on, each costs unitPrice (AC-31.1). */
        PriceTier: {
            /** Format: int32 */
            fromQty?: number;
            /** Format: int64 */
            unitPrice?: number;
        };
        ProductFacetsResponse: {
            brands?: components["schemas"]["CodeCount"][];
            crusts?: components["schemas"]["CodeCount"][];
            fillings?: components["schemas"]["CodeCount"][];
            /** Format: int64 */
            priceMax?: number;
            /** Format: int64 */
            priceMin?: number;
            vendors?: components["schemas"]["VendorCount"][];
        };
        /**
         * @description Step 1 of a product image upload: what the client is about to send. The signed upload only accepts this type and
         *      at most sizeBytes; both are checked again when the product is saved.
         */
        ProductImageUploadRequest: {
            contentType: string;
            /** Format: int64 */
            sizeBytes?: number;
        };
        ProductListingResponse: {
            brand?: string;
            crustCodes?: string[];
            /** @enum {string} */
            deliveryLabel?: "LOCAL" | "NATIONWIDE";
            description?: string;
            /** Format: date */
            expiryDate?: string;
            fillingCodes?: string[];
            id?: string;
            imageKeys?: string[];
            imageUrls?: string[];
            inStock?: boolean;
            isOwn?: boolean;
            /** Format: int64 */
            listPrice?: number;
            name?: string;
            origin?: string;
            /** Format: int32 */
            piecesPerBox?: number;
            priceTiers?: components["schemas"]["JsonNode"];
            provinceCode?: string;
            /** Format: int32 */
            quoteThreshold?: number;
            ratingAvg?: number;
            /** Format: int32 */
            ratingCount?: number;
            /** @enum {string} */
            status?: "ON_SALE" | "HIDDEN" | "REMOVED";
            /** Format: int32 */
            stock?: number;
            /** Format: date-time */
            updatedAt?: string;
            vendorAcceptsOrders?: boolean;
            vendorId?: string;
            vendorName?: string;
        };
        /** @description A product as its Shop and the admins see it. Send <code>version</code> back to replace it. */
        ProductResponse: {
            brand?: string;
            /** Format: date-time */
            createdAt?: string;
            crustCodes?: string[];
            /** @enum {string} */
            deliveryLabel?: "LOCAL" | "NATIONWIDE";
            description?: string;
            /** Format: date */
            expiryDate?: string;
            fillingCodes?: string[];
            id?: string;
            images?: components["schemas"]["Image"][];
            /** Format: int64 */
            listPrice?: number;
            name?: string;
            origin?: string;
            /** Format: int32 */
            piecesPerBox?: number;
            priceTiers?: components["schemas"]["PriceTier"][];
            /** Format: int32 */
            quoteThreshold?: number;
            /** @description set only when REMOVED */
            removedReason?: string;
            resold?: boolean;
            /** @enum {string} */
            status?: "ON_SALE" | "HIDDEN" | "REMOVED";
            /** Format: int32 */
            stock?: number;
            /** Format: date-time */
            updatedAt?: string;
            vendorId?: string;
            /** Format: int64 */
            version?: number;
        };
        ProductReviewResponse: {
            content?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: int32 */
            rating?: number;
            reviewId?: string;
        };
        ProgressUpdateResponse: {
            /** Format: date-time */
            createdAt?: string;
            /** @enum {string} */
            milestone?: "PAID" | "CONFIRMED" | "SHIPPING" | "DEPOSITED" | "AWAITING_MOCKUP_APPROVAL" | "IN_PRODUCTION" | "READY_TO_SHIP" | "DELIVERED" | "COMPLETED";
            note?: string;
            photoKeys?: string[];
        };
        QuotationFieldError: {
            field?: string;
            message?: string;
        };
        QuoteItemRequest: {
            description: string;
            productRef?: string;
            /** Format: int32 */
            quantity: number;
            /** Format: int64 */
            unitPrice: number;
        };
        QuoteItemResponse: {
            /** Format: int64 */
            amount?: number;
            /** @enum {string} */
            customType?: "BAG" | "CARD" | "STICKER" | "TEMPLATE_BOX";
            description?: string;
            /** @enum {string} */
            kind?: "PRODUCT" | "CUSTOM";
            /** Format: int32 */
            lineNo?: number;
            productRef?: string;
            /** Format: int32 */
            quantity?: number;
            /** Format: int64 */
            unitPrice?: number;
        };
        QuoteRequestResponse: {
            /** Format: int64 */
            budget?: number;
            buyerAccountId?: string;
            /** Format: date-time */
            createdAt?: string;
            customSpec?: string;
            customTypes?: ("BAG" | "CARD" | "STICKER" | "TEMPLATE_BOX")[];
            delivery?: components["schemas"]["DeliveryAddressResponse"];
            /** Format: date */
            deliveryDeadline?: string;
            id?: string;
            /** Format: int32 */
            invitedCount?: number;
            productId?: string;
            /** Format: int32 */
            quantity?: number;
            /** Format: int32 */
            quoteCount?: number;
            /** @enum {string} */
            status?: "OPEN" | "AWARDED" | "CLOSED" | "EXPIRED";
            /** Format: int64 */
            suggestedUnitPrice?: number;
            targetVendorId?: string;
            /** @enum {string} */
            type?: "DIRECT" | "OPEN";
        };
        QuoteResponse: {
            acceptable?: boolean;
            /** Format: int64 */
            customSurcharge?: number;
            /** Format: date */
            deliveryDate?: string;
            deliveryMethod?: string;
            /** Format: int64 */
            depositAmount?: number;
            depositRate?: number;
            id?: string;
            items?: components["schemas"]["QuoteItemResponse"][];
            /** Format: int64 */
            itemsAmount?: number;
            notes?: string;
            previousRevisions?: components["schemas"]["QuoteResponse"][];
            /** Format: int64 */
            remainingAmount?: number;
            requestId?: string;
            /** Format: int32 */
            revisionNo?: number;
            /** Format: int64 */
            shippingFee?: number;
            /** @enum {string} */
            status?: "SUBMITTED" | "WITHDRAWN" | "EXPIRED" | "ACCEPTED" | "CLOSED" | "REJECTED";
            /** Format: date-time */
            submittedAt?: string;
            supersedesQuoteId?: string;
            /** Format: int64 */
            totalAmount?: number;
            /** Format: date-time */
            validUntil?: string;
            vendorId?: string;
            vendorName?: string;
            /** Format: date-time */
            withdrawnAt?: string;
        };
        RefreshTokenRequest: {
            refreshToken: string;
        };
        RefundRequest: {
            /** Format: int64 */
            amount?: number;
            paymentId: string;
            /** @enum {string} */
            reason: "DISPUTE" | "LATE_PAYMENT" | "DUPLICATE_PAYMENT" | "QUOTE_EXPIRED";
        };
        RefundResponse: {
            /** Format: int64 */
            amount?: number;
            /** Format: date-time */
            createdAt?: string;
            disputeId?: string;
            error?: string;
            orderId?: string;
            paymentId?: string;
            /** @enum {string} */
            reason?: "DISPUTE" | "LATE_PAYMENT" | "DUPLICATE_PAYMENT" | "QUOTE_EXPIRED";
            refundId?: string;
            /** @enum {string} */
            status?: "PENDING" | "SUCCEEDED" | "MANUAL_REQUIRED";
        };
        RegisterAccountRequest: {
            /** Format: email */
            email: string;
            fullName: string;
            password: string;
            phoneNumber?: string;
        };
        RegisterAccountResponse: {
            email?: string;
            id?: string;
            otpSent?: boolean;
            phoneNumber?: string;
            verified?: boolean;
        };
        /** @description The registration fee level in effect (AC-26.9, FR-53). */
        RegistrationFeeConfigResponse: {
            /** Format: int64 */
            amount?: number;
            /** Format: date-time */
            effectiveFrom?: string;
        };
        /** @description A registration fee payment waiting to be paid (AC-27.4): open paymentUrl to pay on VNPay. */
        RegistrationFeePaymentLinkResponse: {
            /**
             * Format: int64
             * @description whole VND, the level in effect when the payment was created (AC-53.3)
             */
            amount?: number;
            paymentId?: string;
            paymentUrl?: string;
        };
        /** @description The registration fee the vendor paid (BR-31, AC-53.2): at most one per vendor. */
        RegistrationFeePaymentResponse: {
            /** Format: int64 */
            amount?: number;
            /** Format: date-time */
            paidAt?: string;
            paymentId?: string;
        };
        ResetPasswordRequest: {
            /** Format: email */
            email: string;
            newPassword: string;
            otp: string;
        };
        ResolveDisputeRequest: {
            /** @enum {string} */
            decision: "FULL_REFUND" | "PARTIAL_REFUND" | "REJECTED";
            decisionReason: string;
            /** Format: int64 */
            refundAmount?: number;
        };
        ReviewDisbursementRequest: {
            /** Format: int64 */
            approvedAmount?: number;
            reason?: string;
            /** @enum {string} */
            status: "PENDING" | "APPROVED" | "REJECTED";
        };
        ReviewMockupRequest: {
            reviewNote?: string;
            /** @enum {string} */
            reviewStatus: "PENDING_REVIEW" | "APPROVED" | "CHANGES_REQUESTED";
        };
        ReviewResponse: {
            content?: string;
            /** Format: date-time */
            createdAt?: string;
            productId?: string;
            /** Format: int32 */
            rating?: number;
            reviewId?: string;
        };
        /** @description Replaces the whole list of provinces the vendor delivers to (FR-28). */
        SaveDeliveryAreasRequest: {
            /** @description at least one; each a province code of common-reference, e.g. "79" */
            provinceCodes: string[];
        };
        SaveInterprovinceFeesRequest: {
            fees: components["schemas"]["Fee"][];
        };
        /**
         * @description Replaces the vendor's order profile (FR-35). Quantities and prices are checked by their value objects, the terms
         *      a supply source requires by the order terms; an error names the field.
         */
        SaveOrderProfileRequest: {
            /** @description codes of visible crusts of the catalogue (FR-54); one it already has stays even if hidden since */
            crustCodes?: string[];
            /** @description the custom work offered, within BR-14 */
            customTypes?: ("BAG" | "CARD" | "STICKER" | "TEMPLATE_BOX")[];
            /** @description required when the vendor resells, with gatherableQty (AC-35.3) */
            distributedBrands?: string;
            earlyBirdOffer?: string;
            /** @description as crustCodes, for fillings */
            fillingCodes?: string[];
            /** Format: int32 */
            gatherableQty?: number;
            /** Format: int32 */
            leadTimeDays: number;
            logoPrinting?: boolean;
            /** Format: int32 */
            minQty?: number;
            packagingTypes?: string;
            /** @description reference tiers (AC-35.1), at least one, each starting at a different quantity */
            priceTiers: components["schemas"]["PriceTier"][];
            /**
             * Format: int32
             * @description required when the vendor produces itself, with crustCodes, fillingCodes, packagingTypes and
             *          logoPrinting (AC-35.2)
             */
            weeklyCapacity?: number;
        };
        /**
         * @description A whole product, to create one (FR-29) or replace one (FR-30, FR-32, FR-33). Required fields are checked by the
         *      product's own rules, which name the field that fails.
         */
        SaveProductRequest: {
            /** @description left out: the vendor's business name, unless resold (AC-29.4) */
            brand?: string;
            crustCodes?: string[];
            /** @enum {string} */
            deliveryLabel?: "LOCAL" | "NATIONWIDE";
            description?: string;
            /** Format: date */
            expiryDate?: string;
            fillingCodes?: string[];
            /** @description in display order: temp keys of new uploads, or keys the product already has */
            imageKeys?: string[];
            /** Format: int64 */
            listPrice?: number;
            name?: string;
            /** @description required when resold (AC-33.2) */
            origin?: string;
            /** Format: int32 */
            piecesPerBox?: number;
            priceTiers?: components["schemas"]["PriceTier"][];
            /** Format: int32 */
            quoteThreshold?: number;
            /** @description required when the vendor's supply source is BOTH; left out otherwise (AC-29.2) */
            resold?: boolean;
            /** Format: int32 */
            stock?: number;
            /**
             * Format: int64
             * @description the version read before editing; required to replace, ignored to create
             */
            version?: number;
        };
        SendChatMessageRequest: {
            attachmentName?: string;
            attachmentTempKey?: string;
            body?: string;
            notEmpty?: boolean;
        };
        SendOtpRequest: {
            /** Format: email */
            email: string;
        };
        StartConversationRequest: {
            vendorId: string;
        };
        StatusCount: {
            /** Format: int64 */
            orderCount?: number;
            /** @enum {string} */
            status?: "PAID" | "CONFIRMED" | "SHIPPING" | "DEPOSITED" | "AWAITING_MOCKUP_APPROVAL" | "IN_PRODUCTION" | "READY_TO_SHIP" | "DELIVERED" | "COMPLETED";
        };
        SubmitCardRequest: {
            appVersion?: string;
            dateOfExpiry?: string;
            dateOfIssue?: string;
            encryptedFields?: string;
            fullName?: string;
            gender?: string;
            nationality?: string;
            placeOfBirth?: string;
        };
        SubmitCardResponse: {
            /** Format: int32 */
            attemptsLeft?: number;
            /** Format: date-time */
            lockedUntil?: string;
            /** @enum {string} */
            reasonCode?: "SESSION_EXPIRED" | "SESSION_NOT_OWNED" | "SESSION_USED" | "LOCKED" | "BAD_FORMAT" | "CARD_EXPIRED" | "ID_ALREADY_LINKED";
            /** @enum {string} */
            status?: "VERIFIED" | "REJECTED";
        };
        SubmitQuoteRequest: {
            customItems?: components["schemas"]["CustomItemRequest"][];
            /** Format: date */
            deliveryDate: string;
            deliveryMethod: string;
            depositRate: number;
            items: components["schemas"]["QuoteItemRequest"][];
            notes?: string;
            /** Format: int64 */
            shippingFee: number;
            supersedesQuoteId?: string;
            /** Format: int32 */
            validDays: number;
        };
        /**
         * @description Vendor profile, used for the first submission (FR-26) and for resubmitting (AC-27.2). Fields with a format of their
         *      own (tax code, province, representative name and ID number, bank account number) are checked by their value
         *      objects; an error names the field. <code>representativeIdNumber</code> and <code>bankAccountNumber</code> are never logged:
         *      {@link com.moonkage.vendor.vendor.dto.request.SubmitVendorRequest#toString #toString()} leaves them out.
         */
        SubmitVendorRequest: {
            acceptsOrders?: boolean;
            address: string;
            bankAccountHolder: string;
            bankAccountNumber: string;
            bankName: string;
            businessName: string;
            /**
             * @description the first submission sends one of each kind the owner provides; a resubmission sends only the
             *          kinds it replaces, and every kind left out keeps the document the vendor has (AC-27.2)
             */
            documents?: components["schemas"]["Document"][];
            /** @description HOUSEHOLD_BUSINESS or SOLE_PROPRIETORSHIP; a company is refused with its own message (BR-33) */
            entityType: string;
            provinceCode: string;
            representativeIdNumber: string;
            representativeName: string;
            sellsShop?: boolean;
            /** @enum {string} */
            supplySource: "SELF_PRODUCED" | "RESELL" | "BOTH";
            taxCode: string;
        };
        SupplierResponse: {
            businessName?: string;
            customCapabilities?: string[];
            deliveryAreas?: string[];
            earlyBirdOffer?: string;
            isOwn?: boolean;
            /** Format: int32 */
            leadTimeDays?: number;
            /** Format: int32 */
            minQty?: number;
            ordersOnly?: boolean;
            refPriceTiers?: string;
            supplySource?: string;
            vendorId?: string;
        };
        TopProduct: {
            productId?: string;
            productName?: string;
            /** Format: int64 */
            quantity?: number;
            /** Format: int64 */
            revenue?: number;
        };
        TopVendor: {
            /** Format: int64 */
            orderCount?: number;
            /** Format: int64 */
            revenue?: number;
            vendorId?: string;
            vendorName?: string;
        };
        Totals: {
            /** Format: int64 */
            averageOrderValue?: number;
            /** Format: int64 */
            buyerCount?: number;
            /** Format: int64 */
            orderCount?: number;
            /** Format: int64 */
            revenue?: number;
        };
        /** @description Partial change of one value; a field left out stays as it is. The group and the code never change. */
        UpdateCakeAttributeRequest: {
            /** @description false hides the value, true shows it again (AC-54.4, AC-54.5) */
            active?: boolean;
            /** @description a new name (AC-54.3) */
            label?: string;
            /**
             * Format: int32
             * @description a new position, 0 or more (AC-54.6)
             */
            sortOrder?: number;
        };
        UpdateCartItemRequest: {
            /** Format: int32 */
            quantity?: number;
        };
        UpdateInvitationRequest: {
            declineReason?: string;
            /** @enum {string} */
            status: "PENDING" | "QUOTED" | "DECLINED";
        };
        UpdateOrderRequest: {
            note?: string;
            photoTempKeys?: string[];
            receivedConfirmed?: boolean;
            /** @enum {string} */
            status?: "PAID" | "CONFIRMED" | "SHIPPING" | "DEPOSITED" | "AWAITING_MOCKUP_APPROVAL" | "IN_PRODUCTION" | "READY_TO_SHIP" | "DELIVERED" | "COMPLETED";
            trackingCode?: string;
        };
        /** @description A change of status: the Shop hides or shows its product (FR-34), an admin removes it with a reason (FR-46). */
        UpdateProductRequest: {
            /** @description required to remove */
            removedReason?: string;
            /** @enum {string} */
            status: "ON_SALE" | "HIDDEN" | "REMOVED";
        };
        UpdateProfileRequest: {
            fullName: string;
        };
        UpdateQuoteRequest: {
            /** @enum {string} */
            status: "SUBMITTED" | "WITHDRAWN" | "EXPIRED" | "ACCEPTED" | "CLOSED" | "REJECTED";
        };
        /** @description Partial update; each caller sends only its own fields, anything else is refused (403). */
        UpdateVendorRequest: {
            /**
             * Format: int64
             * @description the owner: whole VND, 0 or more, per order delivered inside its areas (FR-28, AC-28.3)
             */
            localDeliveryFee?: number;
            /**
             * @description the admin: only LOCKED (FR-46)
             * @enum {string}
             */
            status?: "PENDING" | "NEEDS_INFO" | "APPROVED" | "REJECTED" | "LOCKED";
            /** @description the admin: required with LOCKED (AC-46.2) */
            statusReason?: string;
        };
        VendorCount: {
            /** Format: int64 */
            count?: number;
            vendorId?: string;
            vendorName?: string;
        };
        /** @description A vendor profile as its owner and the admin see it (FR-27, AC-45.1). Personal numbers are masked only. */
        VendorDetailResponse: {
            acceptsOrders?: boolean;
            address?: string;
            bankAccount?: components["schemas"]["BankAccount"];
            businessName?: string;
            canOperate?: boolean;
            /** Format: date-time */
            createdAt?: string;
            /** @description province codes the vendor delivers to at that fee (FR-28) */
            deliveryAreas?: string[];
            /** @description the current document of each kind */
            documents?: components["schemas"]["VendorDocumentResponse"][];
            /** @enum {string} */
            entityType?: "HOUSEHOLD_BUSINESS" | "SOLE_PROPRIETORSHIP";
            id?: string;
            /**
             * Format: int64
             * @description null until the owner sets it (AC-28.3)
             */
            localDeliveryFee?: number;
            ownerAccountId?: string;
            /** @description the owner check of the latest submission (AC-45.4); null unless the caller is an admin */
            ownerCheck?: components["schemas"]["OwnerCheckResponse"];
            provinceCode?: string;
            /** Format: date-time */
            registrationFeePaidAt?: string;
            representativeIdMasked?: string;
            representativeName?: string;
            sellsShop?: boolean;
            /** @enum {string} */
            status?: "PENDING" | "NEEDS_INFO" | "APPROVED" | "REJECTED" | "LOCKED";
            statusReason?: string;
            /** @enum {string} */
            supplySource?: "SELF_PRODUCED" | "RESELL" | "BOTH";
            taxCode?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        /** @description Short-lived link to a document in the private bucket (AC-27.6). */
        VendorDocumentLinkResponse: {
            /** Format: date-time */
            expiresAt?: string;
            url?: string;
        };
        /** @description A document of a vendor; open it with GET /api/vendors/{vendorId}/documents/{id} (AC-27.6). */
        VendorDocumentResponse: {
            id?: string;
            /** @enum {string} */
            kind?: "BUSINESS_LICENSE" | "FOOD_SAFETY" | "FEE_INVOICE";
            /** Format: date-time */
            uploadedAt?: string;
        };
        VendorFieldError: {
            field?: string;
            message?: string;
        };
        /** @description Vendor summary for its owner and the admins. Other services read {@link com.moonkage.vendor.vendor.VendorView com.moonkage.vendor.vendor.VendorView}. */
        VendorResponse: {
            acceptsOrders?: boolean;
            businessName?: string;
            /**
             * Format: date-time
             * @description when the profile was first submitted, so the admin list shows how long it has waited
             */
            createdAt?: string;
            /** @description HOUSEHOLD_BUSINESS or SOLE_PROPRIETORSHIP, so the admin list shows the kind of unit (BR-33) */
            entityType?: string;
            id?: string;
            ownerAccountId?: string;
            /** @description whether the registration fee came in, so the admin attaches its invoice only then (Q-36) */
            registrationFeePaid?: boolean;
            sellsShop?: boolean;
            status?: string;
            supplySource?: string;
        };
        VendorReviewResponse: {
            adminAccountId?: string;
            /** Format: date-time */
            decidedAt?: string;
            /** @enum {string} */
            decision?: "APPROVE" | "NEEDS_INFO" | "REJECT";
            id?: string;
            licenseChecked?: boolean;
            reason?: string;
            registryChecked?: boolean;
        };
        /**
         * @description What a buyer may read about a shop without being its owner (B-3.2).
         *
         *      <p>Only the fields the public catalogue needs are here: the id, the display name, the head-office province, the
         *      review state, the selling flags and the provinces the shop delivers to. Nothing private crosses this boundary: no
         *      tax code, no address, no representative, no bank account, no document and no admin note (NFR-03).
         */
        VendorSummaryResponse: {
            acceptsOrders?: boolean;
            businessName?: string;
            /** @description approved and registration fee paid (BR-20, BR-31) */
            canOperate?: boolean;
            /** @description province codes the shop delivers to (FR-28) */
            deliveryAreas?: string[];
            id?: string;
            /** @description the head-office province of the shop; null only for a copy written before the field existed */
            provinceCode?: string;
            sellsShop?: boolean;
            /** @enum {string} */
            status?: "PENDING" | "NEEDS_INFO" | "APPROVED" | "REJECTED" | "LOCKED";
        };
        VerifyAccountRequest: {
            /** Format: email */
            email: string;
            otp: string;
        };
        VerifyAccountResponse: {
            email?: string;
            id?: string;
            phoneNumber?: string;
            verified?: boolean;
        };
        VnpayIpnResponse: {
            Message?: string;
            RspCode?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getMyAccount: {
        parameters: {
            query: {
                currentUser: components["schemas"]["CurrentUserInfo"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseAccountResponse"];
                };
            };
        };
    };
    updateMyProfile: {
        parameters: {
            query: {
                currentUser: components["schemas"]["CurrentUserInfo"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProfileRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseAccountResponse"];
                };
            };
        };
    };
    getMyAddresses: {
        parameters: {
            query: {
                currentUser: components["schemas"]["CurrentUserInfo"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListAddAddressResponse"];
                };
            };
        };
    };
    IdentityCreate: {
        parameters: {
            query: {
                currentUser: components["schemas"]["CurrentUserInfo"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddAddressRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseAddAddressResponse"];
                };
            };
        };
    };
    IdentityUpdate: {
        parameters: {
            query: {
                currentUser: components["schemas"]["CurrentUserInfo"];
            };
            header?: never;
            path: {
                addressId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddAddressRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseAddAddressResponse"];
                };
            };
        };
    };
    delete: {
        parameters: {
            query: {
                currentUser: components["schemas"]["CurrentUserInfo"];
            };
            header?: never;
            path: {
                addressId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseLoginResponse"];
                };
            };
        };
    };
    refreshToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshTokenRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseLoginResponse"];
                };
            };
        };
    };
    register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterAccountRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseRegisterAccountResponse"];
                };
            };
        };
    };
    resetPassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResetPasswordRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVoid"];
                };
            };
        };
    };
    sendResetPasswordOtp: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendOtpRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVoid"];
                };
            };
        };
    };
    sendVerifyAccountOtp: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendOtpRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVoid"];
                };
            };
        };
    };
    verifyAccount: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyAccountRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVerifyAccountResponse"];
                };
            };
        };
    };
    getCakeAttributes: {
        parameters: {
            query?: {
                codes?: string[];
                group?: "CRUST" | "FILLING";
                includeHidden?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListCakeAttributeResponse"];
                };
            };
        };
    };
    createCakeAttribute: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCakeAttributeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseCakeAttributeResponse"];
                };
            };
        };
    };
    updateCakeAttribute: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                attributeId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCakeAttributeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseCakeAttributeResponse"];
                };
            };
        };
    };
    get_3: {
        parameters: {
            query: {
                provinceCode: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseCartResponse"];
                };
            };
        };
    };
    addItem: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddCartItemRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseLine"];
                };
            };
        };
    };
    removeItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                itemId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                itemId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCartItemRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseLine"];
                };
            };
        };
    };
    inbox: {
        parameters: {
            query?: {
                as?: "BUYER" | "VENDOR";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListConversationResponse"];
                };
            };
        };
    };
    start: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StartConversationRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseConversationResponse"];
                };
            };
        };
    };
    thread: {
        parameters: {
            query?: {
                before?: number;
                size?: number;
            };
            header?: never;
            path: {
                conversationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseChatThreadResponse"];
                };
            };
        };
    };
    send: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                conversationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendChatMessageRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseChatMessageResponse"];
                };
            };
        };
    };
    OrderMarkRead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                conversationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MarkChatReadRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    typing: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                conversationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    create_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCheckoutRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseCreateCheckoutResponse"];
                };
            };
        };
    };
    get_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                checkoutId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseCheckoutResponse"];
                };
            };
        };
    };
    getTable: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseInterprovinceFeeTableResponse"];
                };
            };
        };
    };
    replace: {
        parameters: {
            query?: never;
            header?: {
                "X-Account-Id"?: string;
                "X-User-Role"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveInterprovinceFeesRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseInterprovinceFeeTableResponse"];
                };
            };
        };
    };
    getProvinceFee: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                provinceCode: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseInterprovinceFeeResponse"];
                };
            };
        };
    };
    list_2: {
        parameters: {
            query?: {
                page?: number;
                payableOnly?: boolean;
                size?: number;
                vendorId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePageResponseLedgerResponse"];
                };
            };
        };
    };
    PaymentGet_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseLedgerResponse"];
                };
            };
        };
    };
    disbursements: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListDisbursementResponse"];
                };
            };
        };
    };
    requestDisbursement: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDisbursementRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseDisbursementResponse"];
                };
            };
        };
    };
    reviewDisbursement: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
                requestId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewDisbursementRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseDisbursementResponse"];
                };
            };
        };
    };
    entries: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListLedgerEntryResponse"];
                };
            };
        };
    };
    payout: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePayoutResponse"];
                };
            };
        };
    };
    refunds: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListRefundResponse"];
                };
            };
        };
    };
    createSession: {
        parameters: {
            query: {
                currentUser: components["schemas"]["CurrentUserInfo"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseCreateNfcSessionResponse"];
                };
            };
        };
    };
    getSession: {
        parameters: {
            query: {
                currentUser: components["schemas"]["CurrentUserInfo"];
            };
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseNfcSessionStatusResponse"];
                };
            };
        };
    };
    submitCard: {
        parameters: {
            query: {
                currentUser: components["schemas"]["CurrentUserInfo"];
            };
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubmitCardRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseSubmitCardResponse"];
                };
            };
        };
    };
    getMyNfcStatus: {
        parameters: {
            query: {
                currentUser: components["schemas"]["CurrentUserInfo"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseNfcStatusResponse"];
                };
            };
        };
    };
    OrchestratorList: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header: {
                "X-Account-Id": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseNotificationPageResponse"];
                };
            };
        };
    };
    OrchestratorMarkRead: {
        parameters: {
            query?: never;
            header: {
                "X-Account-Id": string;
            };
            path: {
                notificationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseNotificationResponse"];
                };
            };
        };
    };
    markAllRead: {
        parameters: {
            query?: never;
            header: {
                "X-Account-Id": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseLong"];
                };
            };
        };
    };
    OrderList_1: {
        parameters: {
            query?: {
                disputeStatus?: "OPEN" | "RESOLVED";
                kind?: "BUY_NOW" | "CUSTOM_ORDER";
                missingInvoice?: boolean;
                page?: number;
                paymentGroupId?: string;
                size?: number;
                status?: "PAID" | "CONFIRMED" | "SHIPPING" | "DEPOSITED" | "AWAITING_MOCKUP_APPROVAL" | "IN_PRODUCTION" | "READY_TO_SHIP" | "DELIVERED" | "COMPLETED";
                vendorId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePageResponseOrderResponse"];
                };
            };
        };
    };
    OrderGet_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseOrderResponse"];
                };
            };
        };
    };
    OrderUpdate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateOrderRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseOrderResponse"];
                };
            };
        };
    };
    OrderGet: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseDisputeResponse"];
                };
            };
        };
    };
    open: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OpenDisputeRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseDisputeResponse"];
                };
            };
        };
    };
    resolve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResolveDisputeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseDisputeResponse"];
                };
            };
        };
    };
    addEvidence: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EvidenceRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseDisputeResponse"];
                };
            };
        };
    };
    invoice: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseFileLinkResponse"];
                };
            };
        };
    };
    attachInvoice: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AttachFileRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseFileLinkResponse"];
                };
            };
        };
    };
    mockups: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListMockupResponse"];
                };
            };
        };
    };
    uploadMockup: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AttachFileRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseMockupResponse"];
                };
            };
        };
    };
    reviewMockup: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
                versionNo: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewMockupRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseMockupResponse"];
                };
            };
        };
    };
    payRemainder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePaymentLinkResponse"];
                };
            };
        };
    };
    progressUpdates: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListProgressUpdateResponse"];
                };
            };
        };
    };
    OrderList: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListReviewResponse"];
                };
            };
        };
    };
    OrderCreate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateReviewRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseReviewResponse"];
                };
            };
        };
    };
    stats: {
        parameters: {
            query?: {
                from?: string;
                to?: string;
                vendorId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseOrderStatsResponse"];
                };
            };
        };
    };
    createUploadLink: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FileUploadRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePresignedUploadLinkResponse"];
                };
            };
        };
    };
    PaymentList_1: {
        parameters: {
            query?: {
                from?: string;
                page?: number;
                purpose?: "CHECKOUT" | "DEPOSIT" | "REMAINDER" | "REGISTRATION_FEE";
                size?: number;
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePageResponsePaymentResponse"];
                };
            };
        };
    };
    PaymentGet: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                paymentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePaymentResponse"];
                };
            };
        };
    };
    ipn: {
        parameters: {
            query: {
                callback: {
                    [key: string]: string;
                };
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["VnpayIpnResponse"];
                };
            };
        };
    };
    vnpayReturn: {
        parameters: {
            query: {
                callback: {
                    [key: string]: string;
                };
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePaymentResponse"];
                };
            };
        };
    };
    search: {
        parameters: {
            query: {
                brand?: string[];
                crust?: string[];
                filling?: string[];
                page?: number;
                priceMax?: number;
                priceMin?: number;
                provinceCode: string;
                q?: string;
                size?: number;
                sort?: string;
                vendorId?: string[];
            };
            header?: {
                "X-Account-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePageResponseProductListingResponse"];
                };
            };
        };
    };
    CatalogGetProduct: {
        parameters: {
            query?: {
                provinceCode?: string;
            };
            header?: {
                "X-Account-Id"?: string;
            };
            path: {
                productId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseProductListingResponse"];
                };
            };
        };
    };
    CatalogGetReviews: {
        parameters: {
            query?: {
                page?: number;
                provinceCode?: string;
                size?: number;
            };
            header?: never;
            path: {
                productId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePageResponseProductReviewResponse"];
                };
            };
        };
    };
    getFacets: {
        parameters: {
            query: {
                provinceCode: string;
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseProductFacetsResponse"];
                };
            };
        };
    };
    searchRequests: {
        parameters: {
            query?: {
                vendorId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListQuoteRequestResponse"];
                };
            };
        };
    };
    QuotationCreate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateQuoteRequestRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseQuoteRequestResponse"];
                };
            };
        };
    };
    getRequest: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                requestId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseQuoteRequestResponse"];
                };
            };
        };
    };
    getInvitations: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                requestId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListInvitationResponse"];
                };
            };
        };
    };
    updateInvitation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                requestId: string;
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateInvitationRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseInvitationResponse"];
                };
            };
        };
    };
    getQuotes: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                requestId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListQuoteResponse"];
                };
            };
        };
    };
    submitQuote: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                requestId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubmitQuoteRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseQuoteResponse"];
                };
            };
        };
    };
    getQuote: {
        parameters: {
            query?: {
                includeRevisions?: boolean;
            };
            header?: never;
            path: {
                quoteId: string;
                requestId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseQuoteResponse"];
                };
            };
        };
    };
    updateQuote: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                quoteId: string;
                requestId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateQuoteRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseQuoteResponse"];
                };
            };
        };
    };
    getAcceptance: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                quoteId: string;
                requestId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseAcceptanceResponse"];
                };
            };
        };
    };
    accept: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                quoteId: string;
                requestId: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["AcceptQuoteRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseAcceptQuoteResponse"];
                };
            };
        };
    };
    PaymentList: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
                status?: "PENDING" | "SUCCEEDED" | "MANUAL_REQUIRED";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePageResponseRefundResponse"];
                };
            };
        };
    };
    confirmManual: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                refundId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseRefundResponse"];
                };
            };
        };
    };
    getCurrentConfig: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseRegistrationFeeConfigResponse"];
                };
            };
        };
    };
    changeFee: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeRegistrationFeeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseRegistrationFeeConfigResponse"];
                };
            };
        };
    };
    searchSuppliers: {
        parameters: {
            query?: {
                customType?: "BAG" | "CARD" | "STICKER" | "TEMPLATE_BOX";
                minQty?: number;
                provinceCode?: string;
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListSupplierResponse"];
                };
            };
        };
    };
    getSupplier: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseSupplierResponse"];
                };
            };
        };
    };
    searchVendors: {
        parameters: {
            query?: {
                ownerAccountId?: string;
                status?: "PENDING" | "NEEDS_INFO" | "APPROVED" | "REJECTED" | "LOCKED";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListVendorResponse"];
                };
            };
        };
    };
    submit: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubmitVendorRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVendorDetailResponse"];
                };
            };
        };
    };
    getVendor: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVendorDetailResponse"];
                };
            };
        };
    };
    resubmit: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubmitVendorRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVendorDetailResponse"];
                };
            };
        };
    };
    VendorUpdate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateVendorRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVendorDetailResponse"];
                };
            };
        };
    };
    getDeliveryAreas: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListString"];
                };
            };
        };
    };
    saveDeliveryAreas: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveDeliveryAreasRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListString"];
                };
            };
        };
    };
    createDocument: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateVendorDocumentRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVendorDocumentResponse"];
                };
            };
        };
    };
    getDocumentLink: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                documentId: string;
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVendorDocumentLinkResponse"];
                };
            };
        };
    };
    getOrderProfile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseOrderProfileResponse"];
                };
            };
        };
    };
    saveOrderProfile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveOrderProfileRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseOrderProfileResponse"];
                };
            };
        };
    };
    getOwnerChecks: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListOwnerCheckResponse"];
                };
            };
        };
    };
    getProducts: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListProductResponse"];
                };
            };
        };
    };
    createProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveProductRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseProductResponse"];
                };
            };
        };
    };
    VendorGetProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                productId: string;
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseProductResponse"];
                };
            };
        };
    };
    replaceProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                productId: string;
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveProductRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseProductResponse"];
                };
            };
        };
    };
    updateProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                productId: string;
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProductRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseProductResponse"];
                };
            };
        };
    };
    createImageUploadLink: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProductImageUploadRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePresignedUploadLinkResponse"];
                };
            };
        };
    };
    getRegistrationFeePayments: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListRegistrationFeePaymentResponse"];
                };
            };
        };
    };
    createRegistrationFeePayment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseRegistrationFeePaymentLinkResponse"];
                };
            };
        };
    };
    VendorGetReviews: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseListVendorReviewResponse"];
                };
            };
        };
    };
    createReview: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateVendorReviewRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVendorReviewResponse"];
                };
            };
        };
    };
    getVendorSummary: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendorId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponseVendorSummaryResponse"];
                };
            };
        };
    };
    createDocumentUploadLink: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DocumentUploadRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ApiResponsePresignedUploadLinkResponse"];
                };
            };
        };
    };
    PaymentCreate: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreatePaymentRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CreatePaymentResponse"];
                };
            };
        };
    };
    request: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefundRequest"];
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
