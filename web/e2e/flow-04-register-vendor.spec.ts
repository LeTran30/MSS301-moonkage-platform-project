import { expect, test, type Page } from '@playwright/test';
import {
  apiGet,
  apiPost,
  apiPut,
  gatewayUrl,
  loginAs,
  unwrapData,
  waitFor,
  SEED_ACCOUNTS,
} from './helpers';
import { createVerifiedAccount, credentialsOf } from './accounts';
import { freshIdNumber, verifyNfc } from './nfc';
import { minimalPdf, uploadFile } from './storage';
import { paymentFromCheckout, payAndWait } from './payment';

/**
 * FLOW 4 — Đăng ký người bán: hồ sơ pháp lý → duyệt → đóng phí mở bán (FR-26, FR-27, FR-45, FR-53).
 *
 * Đây là luồng nhiều bước nhất của sàn, và mỗi bước nằm ở một service khác:
 *
 * 1. **Định danh** (identity-service): tài khoản phải xác minh NFC thì mới
 *    được mở Shop (BR-23).
 * 2. **Nộp hồ sơ** (vendor-service): hồ sơ + giấy tờ (giấy phép kinh doanh và
 *    an toàn thực phẩm) → trạng thái `PENDING`.
 * 3. **Admin duyệt** (vendor-service): `NEEDS_INFO` khi thiếu giấy tờ, rồi người
 *    bán bổ sung, rồi `APPROVE`.
 * 4. **Đóng phí mở bán** (payment-service): tạo giao dịch → IPN VNPay → sự kiện
 *    `payment.succeeded` đi qua RabbitMQ → `canOperate = true`.
 *
 * Vì sao test dùng **tài khoản tạo mới** chứ không dùng tài khoản seed: một tài
 * khoản đã định danh thì không định danh lại được, và một tài khoản đã có Shop
 * thì không nộp hồ sơ thứ hai được (BR-11). Dùng tài khoản seed thì test chỉ
 * chạy được đúng một lần — lần thứ hai sẽ đỏ với lý do khó hiểu. Tài khoản
 * mới được tạo ở đây, xác nhận email bằng mã OTP **thật** (bắt từ sự kiện
 * RabbitMQ), rồi định danh bằng thẻ NFC **thật** (JWE do ứng dụng Verify sinh).
 */

/** Hồ sơ một hộ kinh doanh (BR-33: công ty không đăng ký qua hệ thống này). */
const PROFILE = {
  entityType: 'HOUSEHOLD_BUSINESS',
  address: '128 Nguyễn Văn Cừ, Quận 5, TP.HCM',
  provinceCode: '79',
  bankName: 'Ngân hàng TMCP Ngoại thương Việt Nam',
  bankAccountHolder: 'NGUYEN VAN TEST',
  supplySource: 'BOTH',
  sellsShop: true,
  acceptsOrders: true,
};

/**
 * Họ tên đại diện trên giấy tờ.
 *
 * Quy tắc `RepresentativeName` (VENDOR_102) là `^[A-Z]+( [A-Z]+)*$`: **không
 * dấu, không chữ số**. Nên tên test phải là chữ cái thuần — đặt "E2E" vào
 * tên sẽ bị server từ chối trước khi tới bước định danh.
 */
const REPRESENTATIVE_NAME = 'NGUYEN VAN TEST';

/** Tên hiển thị của tài khoản test (có dấu ở đây được — chỉ tên *trên giấy tờ* bị hạn chế). */
const ACCOUNT_NAME = 'Nguyễn Văn Test';

/** Mã số thuế hợp lệ (10 chữ số, hoặc 12 chữ số cho hộ kinh doanh). */
function taxCode(idNumber: string): string {
  return idNumber;
}

/** Số tài khoản ngân hàng hợp lệ (6..19 chữ số). */
const BANK_ACCOUNT_NUMBER = '0123456789012';

/** Hồ sơ đầy đủ cho một tài khoản đã định danh với số CCCD `idNumber`. */
function vendorRequest(
  idNumber: string,
  businessName: string,
  documents: Array<{ kind: string; objectKey: string }>,
) {
  return {
    businessName,
    entityType: PROFILE.entityType,
    taxCode: taxCode(idNumber),
    address: PROFILE.address,
    provinceCode: PROFILE.provinceCode,
    representativeName: REPRESENTATIVE_NAME,
    representativeIdNumber: idNumber,
    supplySource: PROFILE.supplySource,
    sellsShop: PROFILE.sellsShop,
    acceptsOrders: PROFILE.acceptsOrders,
    bankName: PROFILE.bankName,
    bankAccountNumber: BANK_ACCOUNT_NUMBER,
    bankAccountHolder: PROFILE.bankAccountHolder,
    documents,
  };
}

/** Hồ sơ của người bán (chủ Shop hoặc admin). */
interface VendorDetail {
  id: string;
  businessName?: string;
  status?: string;
  statusReason?: string | null;
  canOperate?: boolean;
  registrationFeePaidAt?: string | null;
  representativeIdMasked?: string | null;
  documents?: Array<{ kind?: string; objectKey?: string }>;
  ownerCheck?: { nameMatch?: string } | null;
}

/**
 * Một quyết định duyệt hồ sơ của admin.
 *
 * `POST /api/vendors/{vendorId}/reviews` trả về **quyết định**, không trả về
 * hồ sơ — trạng thái của Shop nằm ở `GET /api/vendors/{vendorId}`.
 */
interface VendorReview {
  id: string;
  adminAccountId?: string;
  decision: 'APPROVE' | 'NEEDS_INFO' | 'REJECT';
  reason?: string | null;
  licenseChecked?: boolean;
  registryChecked?: boolean;
  decidedAt?: string;
}

/** Hồ sơ Shop của một tài khoản (chủ Shop hoặc admin đọc được). */
async function vendorOf(page: Page, ownerAccountId?: string): Promise<VendorDetail | null> {
  const query = ownerAccountId ? `?ownerAccountId=${ownerAccountId}` : '?ownerAccountId=me';
  const payload = await apiGet<unknown>(page, gatewayUrl(`/api/vendors${query}`));
  const list = unwrapData<VendorDetail[]>(payload);
  return list?.[0] ?? null;
}

/** Chi tiết một Shop theo id. */
async function vendorById(page: Page, vendorId: string): Promise<VendorDetail> {
  const payload = await apiGet<unknown>(page, gatewayUrl(`/api/vendors/${vendorId}`));
  return unwrapData<VendorDetail>(payload);
}

/**
 * Một tài khoản mới: đã đăng ký, đã xác nhận email và **đã định danh**.
 *
 * Trả về cả số CCCD đã dùng, vì hồ sơ Shop phải khai đúng số đó (BR-27).
 */
async function verifiedApplicant(
  page: Page,
): Promise<{ account: ReturnType<typeof credentialsOf>; idNumber: string }> {
  const fresh = await createVerifiedAccount(ACCOUNT_NAME);
  const idNumber = freshIdNumber();

  await loginAs(page, credentialsOf(fresh));
  const result = await verifyNfc(page, {
    idNumber,
    dateOfBirth: '1990-03-15',
    card: {
      fullName: REPRESENTATIVE_NAME,
      gender: 'MALE',
      nationality: 'Việt Nam',
      placeOfBirth: 'Ha Noi',
      dateOfIssue: '2010-05-10',
      dateOfExpiry: '2030-05-10',
    },
  });

  if (result.status !== 'VERIFIED') {
    throw new Error(`Định danh thất bại: ${result.status} (${result.reasonCode ?? 'không rõ lý do'})`);
  }

  return { account: credentialsOf(fresh), idNumber };
}

test.describe('FLOW 4 — Đăng ký người bán', () => {
  test('hồ sơ Shop của tài khoản chưa định danh thì bị chặn', async ({ page }) => {
    // Tài khoản mới nhưng **chưa** định danh: BR-23 chặn ở server.
    const fresh = await createVerifiedAccount('Nguyễn Văn Chưa Định Danh');
    await loginAs(page, credentialsOf(fresh));

    let failed = false;
    let body = '';
    try {
      await apiPost(page, gatewayUrl('/api/vendors'), {
        ...vendorRequest('079190000001', 'Hộ kinh doanh E2E chưa định danh', [
          { kind: 'BUSINESS_LICENSE', objectKey: 'tmp/e2e-license.pdf' },
          { kind: 'FOOD_SAFETY', objectKey: 'tmp/e2e-food-safety.pdf' },
        ]),
      });
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Tài khoản chưa định danh không được mở Shop.').toBe(true);
    expect(body).toContain('403');
    expect(body).toContain('VENDOR_003');
  });

  test('nộp hồ sơ đầy đủ thì Shop ở trạng thái PENDING', async ({ page }) => {
    const { account, idNumber } = await verifiedApplicant(page);
    await loginAs(page, account);

    // Tải giấy tờ thật lên kho lưu trữ đối tượng (MinIO) rồi gửi `objectKey`.
    const licenseKey = await uploadFile(
      page,
      gatewayUrl('/api/vendors/uploads'),
      minimalPdf('Giay phep kinh doanh E2E'),
      'giay-phep-kinh-doanh-e2e.pdf',
      'application/pdf',
    );
    const foodSafetyKey = await uploadFile(
      page,
      gatewayUrl('/api/vendors/uploads'),
      minimalPdf('Giay an toan thuc pham E2E'),
      'giay-an-toan-thuc-pham-e2e.pdf',
      'application/pdf',
    );

    const vendor = await apiPost<VendorDetail>(page, gatewayUrl('/api/vendors'), {
      ...vendorRequest(idNumber, 'Hộ kinh doanh Bánh E2E', [
        { kind: 'BUSINESS_LICENSE', objectKey: licenseKey },
        { kind: 'FOOD_SAFETY', objectKey: foodSafetyKey },
      ]),
    });

    expect(vendor.id).toBeTruthy();
    expect(vendor.status).toBe('PENDING');
    // Chưa đóng phí mở bán thì chưa được vận hành.
    expect(vendor.canOperate).toBe(false);
    expect(vendor.registrationFeePaidAt).toBeNull();

    // Chủ Shop đọc lại được hồ sơ của mình.
    const mine = await vendorOf(page);
    expect(mine?.id).toBe(vendor.id);
  });

  test('thiếu giấy tờ thì bị chặn, và server nói rõ thiếu loại nào', async ({ page }) => {
    const { account, idNumber } = await verifiedApplicant(page);
    await loginAs(page, account);

    // Chỉ nộp giấy phép kinh doanh; thiếu giấy an toàn thực phẩm.
    const licenseKey = await uploadFile(
      page,
      gatewayUrl('/api/vendors/uploads'),
      minimalPdf('Giay phep kinh doanh E2E'),
      'giay-phep-kinh-doanh-e2e.pdf',
      'application/pdf',
    );

    let failed = false;
    let body = '';
    try {
      await apiPost(page, gatewayUrl('/api/vendors'), {
        ...vendorRequest(idNumber, 'Hộ kinh doanh thiếu giấy tờ', [
          { kind: 'BUSINESS_LICENSE', objectKey: licenseKey },
        ]),
      });
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Thiếu giấy an toàn thực phẩm phải bị chặn.').toBe(true);
    expect(body).toContain('VENDOR_006');
    expect(body).toContain('FOOD_SAFETY');
  });

  test('khai số CCCD không phải của mình thì bị chặn (BR-27)', async ({ page }) => {
    const { account } = await verifiedApplicant(page);
    await loginAs(page, account);

    let failed = false;
    let body = '';
    try {
      await apiPost(page, gatewayUrl('/api/vendors'), {
        ...vendorRequest('079190000001', 'Hộ kinh doanh khai sai CCCD', [
          { kind: 'BUSINESS_LICENSE', objectKey: 'tmp/e2e-license.pdf' },
          { kind: 'FOOD_SAFETY', objectKey: 'tmp/e2e-food-safety.pdf' },
        ]),
      });
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Khai sai số CCCD phải bị chặn.').toBe(true);
    expect(body).toContain('VENDOR_004');
  });

  test('admin duyệt hồ sơ, người bán bổ sung giấy tờ và được duyệt lần hai', async ({ page }) => {
    const { account, idNumber } = await verifiedApplicant(page);
    await loginAs(page, account);

    const licenseKey = await uploadFile(
      page,
      gatewayUrl('/api/vendors/uploads'),
      minimalPdf('Giay phep kinh doanh E2E'),
      'giay-phep-kinh-doanh-e2e.pdf',
      'application/pdf',
    );
    const foodSafetyKey = await uploadFile(
      page,
      gatewayUrl('/api/vendors/uploads'),
      minimalPdf('Giay an toan thuc pham E2E'),
      'giay-an-toan-thuc-pham-e2e.pdf',
      'application/pdf',
    );

    const vendor = await apiPost<VendorDetail>(page, gatewayUrl('/api/vendors'), {
      ...vendorRequest(idNumber, 'Hộ kinh doanh Bánh E2E', [
        { kind: 'BUSINESS_LICENSE', objectKey: licenseKey },
        { kind: 'FOOD_SAFETY', objectKey: foodSafetyKey },
      ]),
    });

    // --- Bước 1: admin yêu cầu bổ sung giấy tờ.
    await loginAs(page, SEED_ACCOUNTS.admin);
    const needsInfo = await apiPost<VendorReview>(
      page,
      gatewayUrl(`/api/vendors/${vendor.id}/reviews`),
      {
        decision: 'NEEDS_INFO',
        reason: 'Giấy phép kinh doanh còn thiếu dấu đỏ gần đây.',
      },
    );
    expect(needsInfo.decision).toBe('NEEDS_INFO');

    const afterNeedsInfo = await vendorById(page, vendor.id);
    expect(afterNeedsInfo.status).toBe('NEEDS_INFO');
    expect(afterNeedsInfo.statusReason).toContain('thiếu');

    // --- Bước 2: người bán bổ sung hồ sơ (nộp lại giấy tờ đã sửa).
    // Giấy tờ phải là **tải lên mới**: khi bổ sung, `objectKey` phải là tempKey
    // của một lần tải lên, không phải khóa của giấy tờ đang có.
    await loginAs(page, account);
    const licenseKey2 = await uploadFile(
      page,
      gatewayUrl('/api/vendors/uploads'),
      minimalPdf('Giay phep kinh doanh E2E - ban da sua'),
      'giay-phep-kinh-doanh-e2e-v2.pdf',
      'application/pdf',
    );
    const foodSafetyKey2 = await uploadFile(
      page,
      gatewayUrl('/api/vendors/uploads'),
      minimalPdf('Giay an toan thuc pham E2E - ban da sua'),
      'giay-an-toan-thuc-pham-e2e-v2.pdf',
      'application/pdf',
    );

    const resubmitted = await apiPut<VendorDetail>(
      page,
      gatewayUrl(`/api/vendors/${vendor.id}`),
      vendorRequest(idNumber, 'Hộ kinh doanh Bánh E2E', [
        { kind: 'BUSINESS_LICENSE', objectKey: licenseKey2 },
        { kind: 'FOOD_SAFETY', objectKey: foodSafetyKey2 },
      ]),
    );
    expect(resubmitted.status).toBe('PENDING');

    // --- Bước 3: admin duyệt (AC-45.5: phải xác nhận đã đối chiếu giấy phép).
    await loginAs(page, SEED_ACCOUNTS.admin);
    const approved = await apiPost<VendorReview>(
      page,
      gatewayUrl(`/api/vendors/${vendor.id}/reviews`),
      { decision: 'APPROVE', licenseChecked: true, registryChecked: true },
    );
    expect(approved.decision).toBe('APPROVE');

    const afterApprove = await vendorById(page, vendor.id);
    expect(afterApprove.status).toBe('APPROVED');
    // Đã duyệt nhưng **chưa** đóng phí mở bán thì vẫn chưa vận hành.
    expect(afterApprove.canOperate).toBe(false);
  });

  test('duyệt mà không xác nhận đã đối chiếu giấy phép thì bị chặn (AC-45.5)', async ({ page }) => {
    const { account, idNumber } = await verifiedApplicant(page);
    await loginAs(page, account);

    // Giấy tờ phải là **tải lên thật**: server kiểm tra key là file mới hay
    // file của hồ sơ (VENDOR_007), nên key giả sẽ bị chặn ở bước nộp hồ sơ
    // chứ không tới bước duyệt.
    const licenseKey = await uploadFile(
      page,
      gatewayUrl('/api/vendors/uploads'),
      minimalPdf('Giay phep kinh doanh E2E'),
      'giay-phep-kinh-doanh-e2e.pdf',
      'application/pdf',
    );
    const foodSafetyKey = await uploadFile(
      page,
      gatewayUrl('/api/vendors/uploads'),
      minimalPdf('Giay an toan thuc pham E2E'),
      'giay-an-toan-thuc-pham-e2e.pdf',
      'application/pdf',
    );

    const vendor = await apiPost<VendorDetail>(page, gatewayUrl('/api/vendors'), {
      ...vendorRequest(idNumber, 'Hộ kinh doanh Bánh E2E', [
        { kind: 'BUSINESS_LICENSE', objectKey: licenseKey },
        { kind: 'FOOD_SAFETY', objectKey: foodSafetyKey },
      ]),
    });

    await loginAs(page, SEED_ACCOUNTS.admin);

    let failed = false;
    let body = '';
    try {
      await apiPost(page, gatewayUrl(`/api/vendors/${vendor.id}/reviews`), {
        decision: 'APPROVE',
        licenseChecked: false,
      });
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(failed, 'Duyệt mà chưa xác nhận giấy phép phải bị chặn.').toBe(true);
    expect(body).toContain('VENDOR_011');
  });

  test('đóng phí mở bán thì Shop mới được vận hành (canOperate = true)', async ({ page }) => {
    const { account, idNumber } = await verifiedApplicant(page);
    await loginAs(page, account);

    const licenseKey = await uploadFile(
      page,
      gatewayUrl('/api/vendors/uploads'),
      minimalPdf('Giay phep kinh doanh E2E'),
      'giay-phep-kinh-doanh-e2e.pdf',
      'application/pdf',
    );
    const foodSafetyKey = await uploadFile(
      page,
      gatewayUrl('/api/vendors/uploads'),
      minimalPdf('Giay an toan thuc pham E2E'),
      'giay-an-toan-thuc-pham-e2e.pdf',
      'application/pdf',
    );

    const vendor = await apiPost<VendorDetail>(page, gatewayUrl('/api/vendors'), {
      ...vendorRequest(idNumber, 'Hộ kinh doanh Bánh E2E', [
        { kind: 'BUSINESS_LICENSE', objectKey: licenseKey },
        { kind: 'FOOD_SAFETY', objectKey: foodSafetyKey },
      ]),
    });

    // --- Admin duyệt.
    await loginAs(page, SEED_ACCOUNTS.admin);
    await apiPost(page, gatewayUrl(`/api/vendors/${vendor.id}/reviews`), {
      decision: 'APPROVE',
      licenseChecked: true,
      registryChecked: true,
    });

    // --- Chủ Shop đóng phí mở bán.
    await loginAs(page, account);
    const feePayment = await apiPost<{
      paymentId: string;
      amount: number;
      paymentUrl: string;
    }>(page, gatewayUrl(`/api/vendors/${vendor.id}/registration-fee-payments`), {});

    expect(feePayment.paymentId).toBeTruthy();
    expect(feePayment.amount).toBeGreaterThan(0);
    expect(feePayment.paymentUrl).toContain('vnp_TxnRef');

    // --- Trả phí (IPN đã ký, y hệt VNPay thật).
    const payment = paymentFromCheckout({
      paymentId: feePayment.paymentId,
      paymentUrl: feePayment.paymentUrl,
      totalAmount: feePayment.amount,
    });
    await payAndWait(page, payment);

    // --- Sự kiện `payment.succeeded` đi qua RabbitMQ tới vendor-service.
    await waitFor(
      async () => {
        const current = await vendorById(page, vendor.id);
        return current.canOperate === true;
      },
      { timeout: 30_000 },
    );

    const operating = await vendorById(page, vendor.id);
    expect(operating.status).toBe('APPROVED');
    expect(operating.canOperate).toBe(true);
    expect(operating.registrationFeePaidAt).toBeTruthy();

    // Đóng phí lần hai thì bị chặn (chi phí một lần).
    let failed = false;
    let body = '';
    try {
      await apiPost(page, gatewayUrl(`/api/vendors/${vendor.id}/registration-fee-payments`), {});
    } catch (error) {
      failed = true;
      body = error instanceof Error ? error.message : String(error);
    }
    expect(failed, 'Phí mở bán chỉ đóng một lần.').toBe(true);
    expect(body).toContain('VENDOR_013');
  });
});
