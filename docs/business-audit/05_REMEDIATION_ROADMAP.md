# 05 — Remediation Roadmap

## 1. Nguyên tắc ưu tiên

Thứ tự dựa trên bốn tiêu chí: khả năng sai tiền/quyền, ảnh hưởng order/stock, độ rộng blast radius và dependency nghiệp vụ. Đây là kế hoạch đề xuất để Senior Solution Architect/PO review; tài liệu audit không thực hiện remediation.

## 2. Top 10 vấn đề cần xử lý trước

| Rank | ID | Vấn đề | Lý do ưu tiên |
|---:|---|---|---|
| 1 | AUD-002 | Token cũ vẫn dùng xuyên service sau reset password | Rủi ro truy cập trái quyền toàn nền tảng |
| 2 | AUD-001 | Duplicate checkout/payment do thiếu request idempotency | Có thể thu tiền/giữ kho/tạo đơn trùng |
| 3 | GAP-02 | Chưa có cancellation/refund state & money policy | Block thiết kế đúng cho hủy, late success, refund sau disbursement |
| 4 | AUD-003 | Notification inbox không có nguồn domain | Người dùng bỏ lỡ order/quote/maket/dispute/money action |
| 5 | AUD-004 | Cart bỏ availability/deliverability và hiển thị fee 0 | Sai tổng/khả năng checkout ngay trước bước trả tiền |
| 6 | AUD-006 | FE chặn giải ngân cọc sớm hợp lệ | Phá vỡ flow vốn cho custom order |
| 7 | GAP-11 | Thiếu vận hành/recovery cho paid-but-no-order/poison event | Rủi ro mất khả năng phục hồi khi async flow lỗi dài hạn |
| 8 | AUD-010 | Logout không revoke server session | Kéo dài cửa sổ account takeover |
| 9 | AUD-008 | Không chặn sản phẩm hết hạn | Rủi ro thực phẩm và uy tín marketplace |
| 10 | AUD-009 | Quote giao sau requested deadline vẫn accept | Custom order có thể giao sau sự kiện |

## 3. Roadmap theo phase

### Phase 0 — Khóa quyết định nghiệp vụ và quan sát vận hành

**Mục tiêu:** không sửa state/payment dựa trên giả định.

| Work item | Liên quan | Dependency | Deliverable đề xuất |
|---|---|---|---|
| Chốt cancel/refund/disbursement money matrix | GAP-02, GAP-04 | PO + Finance + Architect | State diagram, actor/action matrix, ledger equations, late callback cases |
| Chốt deadline/complaint/expiry policy | AUD-008, AUD-009, AUD-011, GAP-06, GAP-14 | PO/Ops | Timezone, cutoff, override rule, boundary examples |
| Chốt auth session/revocation semantics | AUD-002, AUD-010 | Security/Architect | TTL, tokenVersion, logout one/all devices, account lock behavior |
| Lập async recovery runbook | GAP-11 | Ops + service owners | Alert, DLQ/replay, paid-no-order query, stock/payment reconciliation |
| Xác minh deployment config VNPay | GAP-12 | DevOps | `confirm-on-return=false` và evidence theo environment |

**Exit criteria:** mọi Q quan trọng có decision record; invariants tiền/state có testable acceptance criteria.

### Phase 1 — Security và chống sai tiền/đơn

| Thứ tự | Work item | Issue | Dependency kỹ thuật | Kiểm chứng bắt buộc |
|---:|---|---|---|---|
| 1.1 | Enforce security stamp tại gateway | AUD-002 | Identity state/cache/event invalidation | Token trước reset password bị từ chối ở order/payment/vendor; cơ chế mở rộng được cho account-state change tương lai |
| 1.2 | Refresh-token rotation và revoke logout | AUD-010 | 1.1, session/token-family store | Logout current/all devices; reuse refresh token bị phát hiện |
| 1.3 | Idempotency cho `POST /api/checkouts` | AUD-001 | DB unique key + response replay | concurrent same key chỉ một checkout/hold/payment; retry sau lost response trả cùng ID |
| 1.4 | Monitoring/replay paid-but-no-order | GAP-11 | event correlation/idempotency hiện có | fault injection sau IPN, redelivery và safe replay không tạo duplicate |
| 1.5 | Khóa config IPN-only confirmation | GAP-12 | deployment profiles | return không mutate; duplicate/late IPN suite pass |

**Lưu ý thiết kế:** không dùng FE disable button làm lớp chống duplicate chính; không gọi identity synchronously trên mọi request nếu chưa đánh giá availability/latency. Security version có cache và event invalidation thường cân bằng tốt hơn.

### Phase 2 — Sửa checkout/cart và flow tiền của vendor

| Thứ tự | Work item | Issue | Dependency | Kiểm chứng |
|---:|---|---|---|---|
| 2.1 | Đồng bộ cart FE model với contract | AUD-004 | Không phụ thuộc Phase 0 | unavailable/undeliverable render đúng; `null` fee không thành 0; CTA disabled |
| 2.2 | Sửa quantity boundary | AUD-005 | 2.1 | 1→0 xóa line hoặc bị chặn có chủ đích |
| 2.3 | Validate invoice theo field | AUD-007 | API error mapping | blank/tax/email không gửi request; BE errors gắn đúng field |
| 2.4 | Tách disbursement eligibility khỏi payout | AUD-006 | Contract/read model tiền | custom `DEPOSITED` có held fund xuất hiện; BUY_NOW không xuất hiện |
| 2.5 | Tính remaining amount theo selected order | AUD-012 | 2.4 | pending+new không vượt held; UI max khớp BE |

**Exit criteria:** không còn UI cho phép thao tác mà backend chắc chắn từ chối ở các boundary đã nêu; FE không tự suy diễn tiền từ aggregate không đúng ngữ cảnh.

### Phase 3 — Notification và lifecycle quotation/order

| Thứ tự | Work item | Issue/gap | Dependency | Kiểm chứng |
|---:|---|---|---|---|
| 3.1 | Domain event → in-app notification mapping | AUD-003 | Recipient resolution, template catalog | order/quote/mockup/dispute/money event tạo đúng một inbox row và STOMP push |
| 3.2 | Request close/expiry lifecycle | AUD-011 | Phase 0 deadline decision | scheduler/command idempotent; vendor không submit sau cutoff |
| 3.3 | Enforce/confirm quoted delivery deviation | AUD-009 | PO quyết định | after-deadline quote bị chặn hoặc explicit buyer override có audit |
| 3.4 | Unified refund timeline/read model | GAP-04 | GAP-02 policy | buyer/admin phân biệt decided/pending/manual/completed; notification đầy đủ |
| 3.5 | Immutable order status history | GAP-07 | state model Phase 0 | from/to/actor/reason/time/eventId đầy đủ, query được khi dispute |

### Phase 4 — Product safety và đặc thù mooncake

| Thứ tự | Work item | Issue/gap | Dependency | Kiểm chứng |
|---:|---|---|---|---|
| 4.1 | Expiry/shelf-life invariant | AUD-008 | PO/Ops policy | create/update/list/reserve boundary theo Vietnam time |
| 4.2 | Promised delivery/cutoff cho BUY_NOW | GAP-06 | delivery SLA/capacity | mỗi order/Shop có promise rõ; checkout báo Shop không đáp ứng |
| 4.3 | Xác định combo model | GAP-05 | Catalog/Inventory design | SKU độc lập được ghi rõ hoặc component reservation atomic |
| 4.4 | Capacity calendar | GAP-10 | delivery/capacity policy | matching/quote tôn trọng capacity; override có audit |
| 4.5 | CCCD re-verification | GAP-13 | Privacy/Security decision | expiry/reverify không lộ PII và không phá order đang chạy ngoài policy |

### Phase 5 — Feature deferred

Thực hiện theo release scope, không trộn vào hotfix:

1. Export quote revision (`GAP-08`).
2. Re-order qua request mới và revalidation (`GAP-09`).
3. Voucher/discount ledger (`GAP-01`).
4. Các nâng cấp combo/capacity còn lại.

## 4. Dependency map

```text
PO money/state decision (GAP-02)
  ├─> unified refund timeline (GAP-04)
  ├─> cancellation implementation tương lai
  └─> reconciliation/recovery acceptance tests (GAP-11)

Auth policy
  ├─> gateway security stamp (AUD-002)
  └─> logout/revoke token family (AUD-010)

Checkout idempotency (AUD-001)
  └─> concurrent checkout/payment/order test suite

Delivery/time policy
  ├─> quote deadline (AUD-009)
  ├─> request expiry (AUD-011)
  ├─> BUY_NOW promise (GAP-06)
  └─> expiry/capacity (AUD-008, GAP-10)

Notification event mapping (AUD-003)
  └─> order/quote/refund/disbursement user-facing lifecycle
```

## 5. Test strategy theo rủi ro

### Contract tests

- Cart DTO phải giữ `available`, `deliverable`, `shippingFee=null` semantics.
- Ledger DTO trả rõ `payoutEligible`, `disbursementEligible`, `remainingDisbursable` thay vì tái dùng một cờ.
- Notification event schema có `eventId`, recipient, type, title/body/link và version.
- Error code ổn định cho field validation và state transition.

### Concurrency/idempotency tests

- 20 request checkout cùng idempotency key → một checkout/payment/reservation.
- Cùng cart với hai key khác nhau phải có policy rõ: cho phép hay chặn active duplicate.
- Duplicate/out-of-order IPN; success sau timeout; success khi stock đã release.
- Concurrent stock reserve; concurrent dispute-open và payout; concurrent quote acceptance.
- Event redelivery sau commit từng bước; inbox/outbox unique constraints.

### State-machine tests

- Mọi transition hợp lệ và mọi transition bỏ bước/terminal đều bị chặn.
- Cancel/refund/disbursement matrix sau khi PO chốt.
- Quote/request/acceptance expiry đúng boundary và timezone.
- Refund `PENDING/MANUAL_REQUIRED/SUCCEEDED` đồng bộ read model nhưng không dịch ledger trước success.

### Authorization tests

- Token trước/sau reset, lock, delete, role/security-version change trên từng service.
- Buyer/vendor/admin và vendor-owner khác nhau trên order, product, chat, ledger, dispute.
- Client tự gắn `X-Account-Id`/role vẫn bị gateway strip.

### Product/UX tests

- Sản phẩm hết hạn, hết hàng, ngừng bán, không giao được tỉnh, đổi giá.
- Nhiều Shop với phí/ngày giao khác nhau.
- Invoice field errors, cart quantity boundary, refresh payment result.
- Notification persisted + realtime + unread/read-all đồng nhất.

## 6. Definition of Done đề xuất cho mỗi remediation

- Có requirement/decision ID và state/invariant rõ.
- Backend authoritative validation; FE phản ánh cùng rule để UX tốt, không thay thế BE guard.
- Idempotency/concurrency test cho mọi money/stock/event write.
- Audit log có actor, target, before/after hoặc decision data theo NFR-07.
- Observability: correlation ID, metric, alert và runbook cho failure async.
- Migration có rollback/forward strategy và kiểm tra dữ liệu hiện hữu.
- Contract test FE-BE và E2E happy/failure path.
- Senior Solution Architect review trước triển khai; Finance/PO sign-off cho money/state changes.

## 7. Thứ tự triển khai rút gọn

1. Chốt policy auth + cancel/refund/deadline.
2. Sửa `AUD-002`, `AUD-010`.
3. Sửa `AUD-001`, bổ sung reconciliation/alert.
4. Sửa cart/checkout FE-BE (`AUD-004`, `005`, `007`).
5. Sửa disbursement (`AUD-006`, `012`).
6. Nối notification (`AUD-003`).
7. Hoàn thiện quote/request/refund lifecycle (`AUD-009`, `011`, `GAP-04`).
8. Enforce expiry/delivery/capacity (`AUD-008`, `GAP-06`, `GAP-10`).
9. Thực hiện feature deferred theo release plan.

