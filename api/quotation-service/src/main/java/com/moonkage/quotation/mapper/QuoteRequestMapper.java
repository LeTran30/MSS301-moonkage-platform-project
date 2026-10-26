package com.moonkage.quotation.mapper;

import com.moonkage.quotation.dto.response.DeliveryAddressResponse;
import com.moonkage.quotation.dto.response.InvitationResponse;
import com.moonkage.quotation.dto.response.QuoteRequestResponse;
import com.moonkage.quotation.entity.QuoteRequest;
import com.moonkage.quotation.entity.RequestInvitation;
import java.util.Comparator;

public final class QuoteRequestMapper {

    private QuoteRequestMapper() {}

    public static QuoteRequestResponse toResponse(
            QuoteRequest request, int invitedCount, int quoteCount, Long suggestedUnitPrice) {
        return new QuoteRequestResponse(
                request.getId(),
                request.getType(),
                request.getBuyerAccountId(),
                request.getTargetVendorId(),
                request.getProductId(),
                request.getQuantity(),
                request.getBudget(),
                request.getCustomTypes().stream()
                        .sorted(Comparator.naturalOrder())
                        .toList(),
                request.getCustomSpec(),
                request.getDeliveryDeadline(),
                toDeliveryResponse(request),
                request.getStatus(),
                invitedCount,
                quoteCount,
                suggestedUnitPrice,
                request.getCreatedAt());
    }

    public static InvitationResponse toInvitationResponse(RequestInvitation invitation, String vendorName) {
        return new InvitationResponse(
                invitation.getVendorId(),
                vendorName,
                invitation.getStatus(),
                invitation.getDeclineReason(),
                invitation.getRespondedAt());
    }

    private static DeliveryAddressResponse toDeliveryResponse(QuoteRequest request) {
        return new DeliveryAddressResponse(
                request.getDeliveryRecipientName(),
                request.getDeliveryRecipientPhone(),
                request.getDeliveryProvinceCode(),
                request.getDeliveryAddressDetail());
    }
}
