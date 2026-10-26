package com.moonkage.payment.service.impl;

import com.moonkage.payment.entity.Refund;
import com.moonkage.payment.enums.RefundReason;
import com.moonkage.payment.repository.RefundRepository;
import com.moonkage.payment.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

    private final RefundRepository refundRepository;

    // shortcut: the refund is recorded PENDING; the VNPay refund call that settles it comes with dispute refunds
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void requestAutomatic(String paymentId, RefundReason reason, long amount) {
        if (reason == RefundReason.DISPUTE) {
            throw new IllegalArgumentException("A dispute refund belongs to an order and a dispute");
        }
        if (refundRepository.existsByOriginalPaymentIdAndReason(paymentId, reason)) {
            return;
        }
        refundRepository.save(Refund.automatic(paymentId, reason, amount));
    }
}
