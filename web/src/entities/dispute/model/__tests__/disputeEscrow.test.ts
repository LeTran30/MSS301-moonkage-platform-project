import { describe, it, expect, beforeEach } from 'vitest';
import { resolveEscrowDispute } from '../disputeEscrow';
import { resolveDispute, disputeStore, type Dispute } from '../disputeStore';

/**
 * Fixture of an open dispute (AC-49.3): the escrow holds 975.000đ, so the
 * refund can never exceed that amount.
 */
const OPEN_DISPUTE: Dispute = {
  id: 'DISP-088',
  orderId: 'MK-1042',
  buyerId: 'usr_buyer',
  buyerName: 'Người mua',
  vendorId: 'ven_shop',
  vendorName: 'Xưởng bánh',
  reason: 'DAMAGED',
  description: 'Hộp bánh bị bẹp góc trong quá trình vận chuyển.',
  images: [],
  evidences: [],
  createdAt: '2026-10-26T10:15:00Z',
  status: 'OPEN',
  orderTotalAmount: 975000,
  escrowHoldingAmount: 975000,
  disbursedAmount: 0,
  maxRefundableAmount: 975000,
};

describe('Quy tắc ký quỹ Escrow & Phân xử khiếu nại (FR-49, AC-49.3)', () => {
  const escrowHolding = 450000;
  const maxRefund = 450000;

  beforeEach(() => {
    disputeStore.set([{ ...OPEN_DISPUTE }]);
  });

  describe('resolveEscrowDispute - Logic hạch toán độc lập', () => {
    it('hoàn tiền 100% cho người mua khi phán quyết FULL_REFUND', () => {
      const res = resolveEscrowDispute(escrowHolding, maxRefund, 'FULL_REFUND');
      expect(res.isValid).toBe(true);
      expect(res.buyerRefund).toBe(450000);
      expect(res.vendorPayout).toBe(0);
    });

    it('từ chối khiếu nại REJECTED: giải ngân 100% cho xưởng, hoàn 0đ cho khách', () => {
      const res = resolveEscrowDispute(escrowHolding, maxRefund, 'REJECTED');
      expect(res.isValid).toBe(true);
      expect(res.buyerRefund).toBe(0);
      expect(res.vendorPayout).toBe(450000);
    });

    it('hoàn một phần PARTIAL_REFUND hợp lệ: phân chia chính xác cho khách và xưởng', () => {
      const res = resolveEscrowDispute(escrowHolding, maxRefund, 'PARTIAL_REFUND', 135000);
      expect(res.isValid).toBe(true);
      expect(res.buyerRefund).toBe(135000);
      expect(res.vendorPayout).toBe(315000);
    });

    it('chặn vi phạm AC-49.3: không cho phép hoàn vượt quá số tiền Escrow đang giữ', () => {
      const res = resolveEscrowDispute(escrowHolding, maxRefund, 'PARTIAL_REFUND', 500000);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('không được vượt quá');
    });

    it('chặn số tiền hoàn âm', () => {
      const res = resolveEscrowDispute(escrowHolding, maxRefund, 'PARTIAL_REFUND', -10000);
      expect(res.isValid).toBe(false);
    });
  });

  describe('resolveDispute - Kiểm thử hàm production trong disputeStore', () => {
    it('từ chối hạch toán vào store nếu số tiền hoàn vượt quá Escrow holding', () => {
      // DISP-088 có holding là 975.000
      const res = resolveDispute('DISP-088', 'PARTIAL_REFUND', 1200000, 'Test vi phạm');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('không được vượt quá');

      // Đảm bảo trạng thái trong store không bị thay đổi
      const d = disputeStore.get().find((item) => item.id === 'DISP-088');
      expect(d?.status).toBe('OPEN');
    });

    it('hạch toán thành công vào store khi số tiền hoàn hợp lệ', () => {
      const res = resolveDispute('DISP-088', 'PARTIAL_REFUND', 135000, 'Hỗ trợ bánh nứt');
      expect(res.isValid).toBe(true);

      const d = disputeStore.get().find((item) => item.id === 'DISP-088');
      expect(d?.status).toBe('RESOLVED');
      expect(d?.refundAmount).toBe(135000);
      expect(d?.disbursedAmount).toBe(975000 - 135000);
    });
  });
});
