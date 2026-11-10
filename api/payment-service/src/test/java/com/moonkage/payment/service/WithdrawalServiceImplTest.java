package com.moonkage.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.payment.dto.request.CreateWithdrawalRequest;
import com.moonkage.payment.dto.request.ReviewWithdrawalRequest;
import com.moonkage.payment.dto.response.BankResponse;
import com.moonkage.payment.entity.Withdrawal;
import com.moonkage.payment.enums.WalletEntryReason;
import com.moonkage.payment.enums.WithdrawalStatus;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.gateway.VietQrBankDirectory;
import com.moonkage.payment.repository.WithdrawalRepository;
import com.moonkage.payment.security.CurrentUserInfo;
import com.moonkage.payment.security.Role;
import com.moonkage.payment.service.impl.WithdrawalServiceImpl;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Q-01: wallet money to a bank account; the money leaves the wallet when asked and comes back when refused. */
class WithdrawalServiceImplTest {

    private static final CurrentUserInfo ADMIN = new CurrentUserInfo("admin-1", Role.ADMIN);
    private static final CurrentUserInfo BUYER = new CurrentUserInfo("buyer-1", Role.MEMBER);

    private final WithdrawalRepository repository = mock(WithdrawalRepository.class);
    private final WalletService walletService = mock(WalletService.class);
    private final WalletNotifier notifier = mock(WalletNotifier.class);
    private final VietQrBankDirectory banks = mock(VietQrBankDirectory.class);
    private WithdrawalServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new WithdrawalServiceImpl(repository, walletService, notifier, banks);
        when(banks.banks()).thenReturn(List.of(new BankResponse("970436", "Vietcombank", "Ngân hàng Ngoại thương")));
        when(repository.save(any(Withdrawal.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void aRequestTakesTheMoneyOutOfTheWalletAtOnce() {
        var answer = service.request("buyer-1", request(200_000L));

        assertEquals(WithdrawalStatus.PENDING, answer.status());
        assertEquals("Vietcombank - Ngân hàng Ngoại thương", answer.bankName());
        verify(walletService).debit("buyer-1", WalletEntryReason.WITHDRAWAL, 200_000L, answer.id());
    }

    @Test
    void aBankOutsideTheListIsRefused() {
        AppException error = assertThrows(
                AppException.class,
                () -> service.request(
                        "buyer-1", new CreateWithdrawalRequest(200_000L, "999999", "0123456789", "NGUYEN THI LAN")));

        assertEquals(ErrorCode.INVALID_INPUT, error.getErrorCode());
        verify(walletService, never()).debit(anyString(), any(), anyLong(), anyString());
    }

    @Test
    void aShortWalletAsksNothing() {
        doThrow(new AppException(ErrorCode.WALLET_INSUFFICIENT))
                .when(walletService)
                .debit(anyString(), any(), anyLong(), anyString());

        AppException error = assertThrows(AppException.class, () -> service.request("buyer-1", request(9_000_000L)));

        assertEquals(ErrorCode.WALLET_INSUFFICIENT, error.getErrorCode());
        verify(repository, never()).save(any());
    }

    @Test
    void aRefusedWithdrawalGivesTheMoneyBack() {
        Withdrawal pending = pending();

        var answer = service.review(
                ADMIN, pending.getId(), new ReviewWithdrawalRequest(WithdrawalStatus.REJECTED, "Sai tên"));

        assertEquals(WithdrawalStatus.REJECTED, answer.status());
        verify(walletService).credit("buyer-1", WalletEntryReason.WITHDRAWAL_RETURNED, 200_000L, pending.getId());
        verify(notifier).notify(eq("buyer-1"), anyString(), anyString(), eq(200_000L));
    }

    @Test
    void aRefusalNeedsAReason() {
        Withdrawal pending = pending();

        AppException error = assertThrows(
                AppException.class,
                () -> service.review(
                        ADMIN, pending.getId(), new ReviewWithdrawalRequest(WithdrawalStatus.REJECTED, " ")));

        assertEquals(ErrorCode.REASON_REQUIRED, error.getErrorCode());
        verify(walletService, never()).credit(anyString(), any(), anyLong(), anyString());
    }

    @Test
    void aCompletedWithdrawalTellsTheBuyerAndMovesNoMoney() {
        Withdrawal pending = pending();

        var answer =
                service.review(ADMIN, pending.getId(), new ReviewWithdrawalRequest(WithdrawalStatus.COMPLETED, null));

        assertEquals(WithdrawalStatus.COMPLETED, answer.status());
        assertEquals("admin-1", pending.getReviewedBy());
        verify(walletService, never()).credit(anyString(), any(), anyLong(), anyString());
        verify(notifier).notify(eq("buyer-1"), anyString(), anyString(), eq(200_000L));
    }

    @Test
    void aClosedWithdrawalIsNotReviewedAgain() {
        Withdrawal done = pending();
        done.setStatus(WithdrawalStatus.COMPLETED);

        AppException error = assertThrows(
                AppException.class,
                () -> service.review(ADMIN, done.getId(), new ReviewWithdrawalRequest(WithdrawalStatus.REJECTED, "x")));

        assertEquals(ErrorCode.INVALID_STATE_TRANSITION, error.getErrorCode());
    }

    @Test
    void onlyAnAdminReviews() {
        AppException error = assertThrows(
                AppException.class,
                () -> service.review(BUYER, "w-1", new ReviewWithdrawalRequest(WithdrawalStatus.COMPLETED, null)));

        assertEquals(ErrorCode.ACCESS_DENIED, error.getErrorCode());
    }

    private Withdrawal pending() {
        Withdrawal withdrawal = Withdrawal.builder()
                .accountId("buyer-1")
                .amount(200_000L)
                .bankBin("970436")
                .bankName("Vietcombank")
                .accountNumber("0123456789")
                .accountName("NGUYEN THI LAN")
                .build();
        when(repository.findForUpdateById(withdrawal.getId())).thenReturn(Optional.of(withdrawal));
        return withdrawal;
    }

    private static CreateWithdrawalRequest request(long amount) {
        return new CreateWithdrawalRequest(amount, "970436", "0123456789", "NGUYEN THI LAN");
    }
}
