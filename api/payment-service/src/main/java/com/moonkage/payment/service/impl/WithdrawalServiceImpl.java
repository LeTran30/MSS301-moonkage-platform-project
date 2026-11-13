package com.moonkage.payment.service.impl;

import com.moonkage.api.PageResponse;
import com.moonkage.payment.dto.request.CreateWithdrawalRequest;
import com.moonkage.payment.dto.request.ReviewWithdrawalRequest;
import com.moonkage.payment.dto.response.BankResponse;
import com.moonkage.payment.dto.response.WalletSummaryResponse;
import com.moonkage.payment.dto.response.WithdrawalResponse;
import com.moonkage.payment.entity.Withdrawal;
import com.moonkage.payment.enums.WalletEntryReason;
import com.moonkage.payment.enums.WithdrawalStatus;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.gateway.VietQrBankDirectory;
import com.moonkage.payment.repository.WithdrawalRepository;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.service.WalletNotifier;
import com.moonkage.payment.service.WalletService;
import com.moonkage.payment.service.WithdrawalService;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class WithdrawalServiceImpl implements WithdrawalService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final int SHOWN_DIGITS = 4;

    private final WithdrawalRepository withdrawalRepository;
    private final WalletService walletService;
    private final WalletNotifier notifier;
    private final VietQrBankDirectory bankDirectory;

    @Override
    @Transactional
    public WithdrawalResponse request(String accountId, CreateWithdrawalRequest request) {
        // the bank must be one of the list; its name is taken from there, not from the request
        BankResponse bank = bankDirectory.banks().stream()
                .filter(b -> b.bin().equals(request.bankBin()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
        Withdrawal withdrawal = Withdrawal.builder()
                .accountId(accountId)
                .amount(request.amount())
                .bankBin(bank.bin())
                .bankName(bank.shortName() + " - " + bank.name())
                .accountNumber(request.accountNumber())
                .accountName(request.accountName().trim())
                .build();
        // the money is set aside first (WALLET_001 when short), so it cannot be spent twice during the transfer
        walletService.debit(accountId, WalletEntryReason.WITHDRAWAL, request.amount(), withdrawal.getId());
        return toResponse(withdrawalRepository.save(withdrawal));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WithdrawalResponse> mine(String accountId) {
        return withdrawalRepository.findByAccountIdOrderByCreatedAtDesc(accountId).stream()
                .map(WithdrawalServiceImpl::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WithdrawalResponse> list(CurrentUserInfo caller, WithdrawalStatus status, int page, int size) {
        requireAdmin(caller);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return PageResponse.from(withdrawalRepository
                .findByStatusOrderByCreatedAtAsc(status, pageable)
                .map(WithdrawalServiceImpl::toResponse));
    }

    @Override
    @Transactional
    public WithdrawalResponse review(CurrentUserInfo caller, String withdrawalId, ReviewWithdrawalRequest request) {
        requireAdmin(caller);
        Withdrawal withdrawal = withdrawalRepository
                .findForUpdateById(withdrawalId)
                .orElseThrow(() -> new AppException(ErrorCode.WITHDRAWAL_NOT_FOUND));
        if (withdrawal.getStatus() != WithdrawalStatus.PENDING || request.status() == WithdrawalStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_STATE_TRANSITION);
        }
        String money = WalletNotifier.money(withdrawal.getAmount());
        if (request.status() == WithdrawalStatus.REJECTED) {
            if (!StringUtils.hasText(request.reason())) {
                throw new AppException(ErrorCode.REASON_REQUIRED);
            }
            withdrawal.setRejectReason(request.reason().trim());
            walletService.credit(
                    withdrawal.getAccountId(),
                    WalletEntryReason.WITHDRAWAL_RETURNED,
                    withdrawal.getAmount(),
                    withdrawal.getId());
            notifier.notify(
                    withdrawal.getAccountId(),
                    "Yêu cầu rút " + money + " bị từ chối",
                    "Lý do: " + withdrawal.getRejectReason() + ". Số tiền đã được trả lại vào ví Moonkage của bạn.",
                    withdrawal.getAmount());
        } else {
            notifier.notify(
                    withdrawal.getAccountId(),
                    "Đã chuyển " + money + " về tài khoản ngân hàng",
                    "Moonkage đã chuyển tiền tới tài khoản " + withdrawal.getBankName() + " "
                            + masked(withdrawal.getAccountNumber()) + ". Tiền có thể mất vài phút để về tài khoản.",
                    withdrawal.getAmount());
        }
        withdrawal.setStatus(request.status());
        withdrawal.setReviewedBy(caller.accountId());
        withdrawal.setReviewedAt(Instant.now());
        return toResponse(withdrawal);
    }

    @Override
    @Transactional(readOnly = true)
    public WalletSummaryResponse summary(CurrentUserInfo caller) {
        requireAdmin(caller);
        return new WalletSummaryResponse(
                walletService.totalBalance(),
                withdrawalRepository.countByStatus(WithdrawalStatus.PENDING),
                withdrawalRepository.sumAmountByStatus(WithdrawalStatus.PENDING));
    }

    private static void requireAdmin(CurrentUserInfo caller) {
        if (!caller.isAdmin()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }

    /** Only the last 4 digits in a notice that may land in an email (NFR-03). */
    private static String masked(String accountNumber) {
        return "****" + accountNumber.substring(Math.max(0, accountNumber.length() - SHOWN_DIGITS));
    }

    private static WithdrawalResponse toResponse(Withdrawal w) {
        return new WithdrawalResponse(
                w.getId(),
                w.getAccountId(),
                w.getAmount(),
                w.getBankBin(),
                w.getBankName(),
                w.getAccountNumber(),
                w.getAccountName(),
                w.getStatus(),
                w.getRejectReason(),
                w.getCreatedAt(),
                w.getReviewedAt());
    }
}
