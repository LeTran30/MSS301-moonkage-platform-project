import { describe, it, expect } from 'vitest';
import { GATEWAY, NOT_IMPLEMENTED_YET } from '../gateway';

describe('Shared API - Gateway Contract Verification (T-04)', () => {
  it('khớp chính xác các endpoint của Identity & Account Controller', () => {
    expect(GATEWAY.IDENTITY.ME).toBe('/api/accounts/me');
    expect(GATEWAY.IDENTITY.REFRESH).toBe('/api/auth/refresh-token');
    expect(GATEWAY.IDENTITY.UPDATE_PROFILE).toBe('/api/accounts/me/profile');
    expect(GATEWAY.IDENTITY.NFC_SESSIONS).toBe('/api/nfc/sessions');
    expect(GATEWAY.IDENTITY.NFC_SESSION_CARD('sess-123')).toBe(
      '/api/nfc/sessions/sess-123/card',
    );
  });

  it('khớp endpoint của Vendor & Supplier Controllers', () => {
    expect(GATEWAY.VENDOR.BASE).toBe('/api/vendors');
    expect(GATEWAY.VENDOR.REGISTER).toBe('/api/vendors');
    expect(GATEWAY.VENDOR.SUPPLIERS).toBe('/api/suppliers');
    expect(GATEWAY.VENDOR.SUPPLIER_BY_ID('ven-1')).toBe('/api/suppliers/ven-1');
  });

  it('endpoint chấp nhận báo giá là /acceptance, không phải /select', () => {
    // QuoteRequestController: @PostMapping("/{requestId}/quotes/{quoteId}/acceptance")
    expect(GATEWAY.QUOTATION.ACCEPT_QUOTE('REQ-1', 'QUO-1')).toBe(
      '/api/quote-requests/REQ-1/quotes/QUO-1/acceptance',
    );
    expect(GATEWAY.QUOTATION.GET_ACCEPTANCE('REQ-1', 'QUO-1')).toBe(
      '/api/quote-requests/REQ-1/quotes/QUO-1/acceptance',
    );
    expect(GATEWAY.QUOTATION.REQUEST_QUOTES('REQ-1')).toBe(
      '/api/quote-requests/REQ-1/quotes',
    );
  });

  it('khớp endpoint của Order & Dispute Controllers', () => {
    expect(GATEWAY.ORDER.CART).toBe('/api/carts/me');
    expect(GATEWAY.ORDER.DISPUTE('MK-123')).toBe('/api/orders/MK-123/dispute');
    expect(GATEWAY.ORDER.MAKET_MOCKUPS('MK-123')).toBe('/api/orders/MK-123/mockups');
    expect(GATEWAY.ORDER.MAKET_PATCH('MK-123', 2)).toBe('/api/orders/MK-123/mockups/2');
  });

  it('khớp endpoint của Payment & Ledger Controllers', () => {
    expect(GATEWAY.PAYMENT.LEDGER_BY_ORDER('MK-123')).toBe('/api/ledgers/MK-123');
    expect(GATEWAY.PAYMENT.APPROVE_PAYOUT('MK-123')).toBe('/api/ledgers/MK-123/payout');
    expect(GATEWAY.PAYMENT.VNPAY_IPN).toBe('/api/payments/vnpay/ipn');
    expect(GATEWAY.PAYMENT.VNPAY_RETURN).toBe('/api/payments/vnpay/return');
  });

  it('khớp endpoint của Orchestrator NotificationController (BE-04b)', () => {
    expect(GATEWAY.ORCHESTRATOR.NOTIFICATIONS).toBe('/api/notifications');
    expect(GATEWAY.ORCHESTRATOR.NOTIFICATION_MARK_READ('notif-1')).toBe('/api/notifications/notif-1/read');
    expect(GATEWAY.ORCHESTRATOR.NOTIFICATIONS_MARK_ALL_READ).toBe('/api/notifications/read-all');
  });

  it('đánh dấu rõ ràng các endpoint chưa được cung cấp qua REST công khai', () => {
    expect(NOT_IMPLEMENTED_YET.AUDIT_LOGS).toBe('/api/audit-logs');
    expect(NOT_IMPLEMENTED_YET.VNPAY_CREATE_PUBLIC).toBe('/api/payments');
  });
});
