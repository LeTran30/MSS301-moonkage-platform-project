package com.moonkage.vendor.vendor;

import com.moonkage.vendor.client.PaymentClient;
import com.moonkage.vendor.client.dto.CreatePaymentRequest;
import com.moonkage.vendor.client.dto.CreatePaymentResponse;
import com.moonkage.vendor.client.dto.PaymentPurpose;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.Price;
import com.moonkage.vendor.registrationfee.RegistrationFeeService;
import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.dto.response.RegistrationFeePaymentLinkResponse;
import com.moonkage.vendor.vendor.dto.response.RegistrationFeePaymentResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * The registration fee of a vendor: what it was charged, and the payment the owner starts (BR-31, AC-53.3).
 *
 * <p>Split out of {@link VendorServiceImpl} because the fee is paid once, through payment-service, and the rules of
 * that payment (who may pay, how much, when) belong with the fee and not with the profile.
 */
@Component
@RequiredArgsConstructor
class VendorFeePaymentService {

    private final PaymentClient paymentClient;
    private final RegistrationFeeService registrationFeeService;

    /** The payments made for the fee; empty until it is paid. */
    List<RegistrationFeePaymentResponse> paymentsOf(Vendor vendor) {
        if (!vendor.isRegistrationFeePaid()) {
            return List.of();
        }
        return List.of(new RegistrationFeePaymentResponse(
                vendor.getRegistrationFeePaymentId(),
                vendor.getRegistrationFeeAmount().value(),
                vendor.getRegistrationFeePaidAt()));
    }

    /**
     * Starts the payment of the fee at the level in effect now (AC-53.3). No transaction: nothing is written here,
     * and none should stay open across the call to payment-service.
     */
    RegistrationFeePaymentLinkResponse startPayment(Vendor vendor, CurrentUserInfo caller) {
        if (!vendor.isOwnedBy(caller.accountId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        vendor.checkRegistrationFeePayable();
        Price fee = registrationFeeService.getCurrentFee();
        CreatePaymentResponse payment = paymentClient.createPayment(
                vendor.getId(),
                new CreatePaymentRequest(
                        PaymentPurpose.REGISTRATION_FEE, vendor.getId(), caller.accountId(), fee.value()));
        return new RegistrationFeePaymentLinkResponse(payment.paymentId(), fee.value(), payment.paymentUrl());
    }
}
