package com.moonkage.payment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.moonkage.payment.entity.Ledger;
import com.moonkage.payment.entity.LedgerEntry;
import com.moonkage.payment.entity.OrderSnapshot;
import com.moonkage.payment.enums.LedgerEntryKind;
import com.moonkage.payment.exception.AppException;
import com.moonkage.payment.exception.ErrorCode;
import com.moonkage.payment.repository.LedgerEntryRepository;
import com.moonkage.payment.repository.LedgerRepository;
import com.moonkage.payment.repository.OrderSnapshotRepository;
import com.moonkage.payment.service.impl.LedgerServiceImpl;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * BE-02: the double-entry ledger of an order (NFR-07, NFR-09, P-04).
 *
 * <p>These tests assert **values**, not only "no exception": a wrong amount is a wrong amount of money, and a test
 * that only checks the call did not throw would let it through.
 */
class LedgerServiceImplTest {

    private static final String ORDER_ID = "order-1";
    private static final String VENDOR_ID = "vendor-1";

    private LedgerRepository ledgerRepository;
    private LedgerEntryRepository ledgerEntryRepository;
    private OrderSnapshotRepository snapshotRepository;
    private LedgerServiceImpl ledgerService;

    /** The saved entries, so the test can check the sum against the balance. */
    private final List<LedgerEntry> savedEntries = new ArrayList<>();

    @BeforeEach
    void setUp() {
        ledgerRepository = org.mockito.Mockito.mock(LedgerRepository.class);
        ledgerEntryRepository = org.mockito.Mockito.mock(LedgerEntryRepository.class);
        snapshotRepository = org.mockito.Mockito.mock(OrderSnapshotRepository.class);
        ledgerService = new LedgerServiceImpl(ledgerRepository, ledgerEntryRepository, snapshotRepository);

        when(ledgerEntryRepository.save(any(LedgerEntry.class))).thenAnswer(invocation -> {
            savedEntries.add(invocation.getArgument(0));
            return invocation.getArgument(0);
        });
        when(ledgerRepository.save(any(Ledger.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void collectingMoneyOpensTheLedgerAndHoldsItAll() {
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.empty());
        when(snapshotRepository.findById(ORDER_ID)).thenReturn(Optional.empty());

        ledgerService.collect(ORDER_ID, 500_000L, "payment-1");

        ArgumentCaptor<Ledger> captor = ArgumentCaptor.forClass(Ledger.class);
        verify(ledgerRepository).save(captor.capture());
        Ledger ledger = captor.getValue();
        assertThat(ledger.getOrderId()).isEqualTo(ORDER_ID);
        assertThat(ledger.getTotalCollected()).isEqualTo(500_000L);
        // the money is held until it is paid out; nothing leaves without an approval
        assertThat(ledger.getHeld()).isEqualTo(500_000L);
        assertThat(ledger.getDisbursed()).isZero();
        assertThat(ledger.getRefunded()).isZero();
        assertThat(ledger.getPaidOut()).isZero();
    }

    @Test
    void collectingTwiceAddsUpInsteadOfReplacing() {
        Ledger ledger = ledgerOf(500_000L, 500_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));

        ledgerService.collect(ORDER_ID, 200_000L, "payment-2");

        assertThat(ledger.getTotalCollected()).isEqualTo(700_000L);
        assertThat(ledger.getHeld()).isEqualTo(700_000L);
    }

    @Test
    void theVendorComesFromTheOrderSnapshotWhenItArrivedFirst() {
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.empty());
        OrderSnapshot snapshot = new OrderSnapshot();
        snapshot.setOrderId(ORDER_ID);
        snapshot.setVendorId(VENDOR_ID);
        when(snapshotRepository.findById(ORDER_ID)).thenReturn(Optional.of(snapshot));

        ledgerService.collect(ORDER_ID, 100_000L, "payment-1");

        ArgumentCaptor<Ledger> captor = ArgumentCaptor.forClass(Ledger.class);
        verify(ledgerRepository).save(captor.capture());
        assertThat(captor.getValue().getVendorId()).isEqualTo(VENDOR_ID);
    }

    @Test
    void theLedgerHoldsOnlyWhatItHolds() {
        Ledger ledger = ledgerOf(500_000L, 500_000L);
        when(ledgerRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));

        assertThat(ledgerService.holds(ORDER_ID, 500_000L)).isTrue();
        assertThat(ledgerService.holds(ORDER_ID, 500_001L)).isFalse();
    }

    @Test
    void aMissingLedgerHoldsNothing() {
        when(ledgerRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.empty());
        assertThat(ledgerService.holds(ORDER_ID, 1L)).isFalse();
    }

    @Test
    void refundingTakesTheMoneyOutOfTheHeldPart() {
        Ledger ledger = ledgerOf(500_000L, 500_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));

        ledgerService.refund(ORDER_ID, 120_000L, "refund-1", "admin-1");

        assertThat(ledger.getHeld()).isEqualTo(380_000L);
        assertThat(ledger.getRefunded()).isEqualTo(120_000L);
        assertThat(ledger.getTotalCollected()).isEqualTo(500_000L);
        assertThat(ledger.getPaidOut()).isZero();
    }

    @Test
    void disbursingTakesTheMoneyOutOfTheHeldPart() {
        Ledger ledger = ledgerOf(500_000L, 500_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));

        ledgerService.disburse(ORDER_ID, 300_000L, "request-1", "admin-1");

        assertThat(ledger.getHeld()).isEqualTo(200_000L);
        assertThat(ledger.getDisbursed()).isEqualTo(300_000L);
    }

    @Test
    void payingOutTakesTheRestOutOfTheHeldPart() {
        Ledger ledger = ledgerOf(500_000L, 200_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));

        ledgerService.payout(ORDER_ID, 200_000L, "payout-1", "admin-1");

        assertThat(ledger.getHeld()).isZero();
        assertThat(ledger.getPaidOut()).isEqualTo(200_000L);
    }

    @Test
    void neverGivesOutMoreThanIsHeld() {
        Ledger ledger = ledgerOf(500_000L, 100_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));

        assertThatThrownBy(() -> ledgerService.disburse(ORDER_ID, 100_001L, "request-1", "admin-1"))
                .isInstanceOf(AppException.class)
                .extracting(exception -> ((AppException) exception).getErrorCode())
                .isEqualTo(ErrorCode.LEDGER_INSUFFICIENT);

        // nothing changed: the balance must not have moved
        assertThat(ledger.getHeld()).isEqualTo(100_000L);
        assertThat(ledger.getDisbursed()).isZero();
        verify(ledgerEntryRepository, never()).save(any(LedgerEntry.class));
    }

    @Test
    void refusesAnAmountOfZeroOrLess() {
        Ledger ledger = ledgerOf(500_000L, 500_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));

        assertThatThrownBy(() -> ledgerService.refund(ORDER_ID, 0L, "refund-1", "admin-1"))
                .isInstanceOf(AppException.class);
        assertThatThrownBy(() -> ledgerService.refund(ORDER_ID, -1L, "refund-1", "admin-1"))
                .isInstanceOf(AppException.class);
        assertThat(ledger.getHeld()).isEqualTo(500_000L);
    }

    @Test
    void refusesToMoveMoneyOfAnOrderWithoutALedger() {
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ledgerService.disburse(ORDER_ID, 1L, "request-1", "admin-1"))
                .isInstanceOf(AppException.class)
                .extracting(exception -> ((AppException) exception).getErrorCode())
                .isEqualTo(ErrorCode.LEDGER_NOT_FOUND);
    }

    @Test
    void everyMovementIsWrittenDownWithItsKindAndReference() {
        Ledger ledger = ledgerOf(500_000L, 500_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));

        ledgerService.collect(ORDER_ID, 100_000L, "payment-9");
        ledgerService.disburse(ORDER_ID, 50_000L, "request-9", "admin-1");
        ledgerService.refund(ORDER_ID, 20_000L, "refund-9", "admin-2");

        assertThat(savedEntries).hasSize(3);
        assertThat(savedEntries.get(0).getKind()).isEqualTo(LedgerEntryKind.COLLECT);
        assertThat(savedEntries.get(0).getReferenceId()).isEqualTo("payment-9");
        assertThat(savedEntries.get(0).getAmount()).isEqualTo(100_000L);
        assertThat(savedEntries.get(1).getKind()).isEqualTo(LedgerEntryKind.DISBURSE);
        assertThat(savedEntries.get(1).getActorAccountId()).isEqualTo("admin-1");
        assertThat(savedEntries.get(2).getKind()).isEqualTo(LedgerEntryKind.REFUND);
        assertThat(savedEntries.get(2).getAmount()).isEqualTo(20_000L);
    }

    @Test
    void theEntriesAddUpToWhatTheBalanceShows() {
        Ledger ledger = ledgerOf(500_000L, 500_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));

        ledgerService.collect(ORDER_ID, 100_000L, "payment-1");
        ledgerService.disburse(ORDER_ID, 200_000L, "request-1", "admin-1");
        ledgerService.refund(ORDER_ID, 50_000L, "refund-1", "admin-1");
        ledgerService.payout(ORDER_ID, 350_000L, "payout-1", "admin-1");

        // collected - disbursed - refunded - paidOut == held
        assertThat(ledger.getHeld())
                .isEqualTo(ledger.getTotalCollected()
                        - ledger.getDisbursed()
                        - ledger.getRefunded()
                        - ledger.getPaidOut());
        assertThat(ledger.getHeld()).isZero();
        assertThat(savedEntries).hasSize(4);
    }

    @Test
    void describingTheLedgerFillsTheVendorAndTheExpectedDate() {
        Ledger ledger = ledgerOf(500_000L, 500_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));

        ledgerService.describe(ORDER_ID, VENDOR_ID, java.time.LocalDate.of(2026, 11, 20));

        assertThat(ledger.getVendorId()).isEqualTo(VENDOR_ID);
        assertThat(ledger.getExpectedPayoutDate()).isEqualTo(java.time.LocalDate.of(2026, 11, 20));
    }

    @Test
    void describingALedgerThatDoesNotExistDoesNothing() {
        when(ledgerRepository.findForUpdateByOrderId(anyString())).thenReturn(Optional.empty());

        ledgerService.describe(ORDER_ID, VENDOR_ID, java.time.LocalDate.of(2026, 11, 20));

        verify(ledgerRepository, never()).save(any(Ledger.class));
        verify(ledgerEntryRepository, never()).save(any(LedgerEntry.class));
    }

    @Test
    void theLedgerIsWrittenOncePerMovement() {
        Ledger ledger = ledgerOf(500_000L, 500_000L);
        when(ledgerRepository.findForUpdateByOrderId(ORDER_ID)).thenReturn(Optional.of(ledger));

        ledgerService.disburse(ORDER_ID, 100_000L, "request-1", "admin-1");

        verify(ledgerRepository, times(1)).save(ledger);
        verify(ledgerEntryRepository, times(1)).save(any(LedgerEntry.class));
    }

    private static Ledger ledgerOf(long totalCollected, long held) {
        Ledger ledger = new Ledger();
        ledger.setOrderId(ORDER_ID);
        ledger.setVendorId(VENDOR_ID);
        ledger.setTotalCollected(totalCollected);
        ledger.setHeld(held);
        ledger.setDisbursed(0L);
        ledger.setRefunded(0L);
        ledger.setPaidOut(0L);
        return ledger;
    }
}
