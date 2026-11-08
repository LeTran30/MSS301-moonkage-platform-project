# quotation-service

> Yêu cầu báo giá, lời mời, báo giá và bản chép ràng buộc khi chấp nhận (FR-14 → FR-17, FR-19, FR-36, FR-38). Thiết kế: [api-db/quotation.md](../../architecture/api-db/quotation.md). Database: `quotation_db` (cổng 5443), migration ở `api/quotation-service/src/main/resources/db/migration`.

## Luồng chính

```mermaid
sequenceDiagram
  participant B as Người mua
  participant Q as quotation
  participant I as identity
  participant S as Người bán
  participant P as payment
  B->>Q: POST /api/quote-requests (DIRECT | OPEN)
  Q->>I: GET /internal/nfc/status/{accountId} (BR-23)
  Q-->>Q: ghép người bán từ vendor_snapshots (BR-16, BR-22), tạo lời mời
  S->>Q: POST /api/quote-requests/{id}/quotes (máy chủ tính tổng, cọc)
  B->>Q: POST .../quotes/{quoteId}/acceptance
  Q-->>Q: snapshot + SHA-256, PENDING_PAYMENT
  Q->>P: POST /internal/payments (DEPOSIT)
  P-->>Q: payment.succeeded (chưa nối, xem "Chưa làm")
  Q-->>Q: SUCCEEDED, quote ACCEPTED, quote khác CLOSED, request AWARDED, outbox quote.accepted
```

## API

Mọi API trả `ApiResponse<T>` (`status, code, message, data, timestamp`) như identity. Người gọi lấy từ header `X-Account-Id`, `X-User-Role` do gateway gắn. Một đường dẫn cho mọi vai (L-17): service tự xác định người gọi là người mua, chủ người bán được mời, hay quản trị.

| Method, đường dẫn | Ai | Việc |
| --- | --- | --- |
| `POST /api/quote-requests` | M (đã NFC) | Tạo yêu cầu `DIRECT` hoặc `OPEN` |
| `GET /api/quote-requests` | M, A | Yêu cầu của mình (A: tất cả), kèm số người bán được mời, số báo giá |
| `GET /api/quote-requests?vendorId=` | S | Yêu cầu gửi tới Shop mình |
| `GET /api/quote-requests/{requestId}` | M, S, A | Chi tiết; S kèm `suggestedUnitPrice` theo bậc giá tham khảo (AC-38.2) |
| `GET /api/quote-requests/{requestId}/invitations` | M, S, A | Lời mời (S chỉ thấy của mình) |
| `PATCH /api/quote-requests/{requestId}/invitations/{vendorId}` | S | `{status: DECLINED, declineReason}` |
| `GET /api/quote-requests/{requestId}/quotes` | M, S, A | Bảng so sánh: bản mới nhất của mỗi người bán; `acceptable` tắt nút chấp nhận khi hết hạn |
| `POST /api/quote-requests/{requestId}/quotes` | S | Gửi báo giá; `supersedesQuoteId` để gửi bản mới thay bản cũ |
| `GET /api/quote-requests/{requestId}/quotes/{quoteId}?includeRevisions=` | M, S, A | Chi tiết, kèm các bản trước |
| `PATCH /api/quote-requests/{requestId}/quotes/{quoteId}` | S | `{status: WITHDRAWN}` |
| `POST /api/quote-requests/{requestId}/quotes/{quoteId}/acceptance` | M | Chấp nhận, kèm `invoiceInfo` tùy chọn → `{acceptanceId, paymentUrl, paymentExpiresAt}` |
| `GET /api/quote-requests/{requestId}/quotes/{quoteId}/acceptance` | M, S, A | Bản chép ràng buộc (`snapshot`, `contentHash`) và trạng thái cọc |
| `GET /api/suppliers?provinceCode=&customType=&minQty=&q=` | K, M | Đơn vị nhận đặt hàng; `ordersOnly` cho nhãn "Chỉ nhận đặt hàng" |
| `GET /api/suppliers/{vendorId}` | K, M | Hồ sơ nhận đặt hàng, `isOwn` (BR-22) |

Khác với bảng thiết kế: báo giá gửi `validDays` (1–14, Q-19) thay cho `validUntil`, để máy chủ tự tính mốc và không lệch đồng hồ với client.

## Luật kiểm ở máy chủ

| Luật | Ở đâu |
| --- | --- |
| BR-23 đã xác minh NFC | Tạo yêu cầu, chấp nhận báo giá (gọi identity) |
| BR-22 không tự giao dịch | Yêu cầu trực tiếp, ghép yêu cầu mở, gửi báo giá, chấp nhận (lớp chặn cuối, AC-19.4) |
| BR-16 số lượng tối thiểu, custom, vùng giao | Yêu cầu trực tiếp (tối thiểu, custom); yêu cầu mở (cả ba) |
| BR-20, BR-31 người bán bị khóa hoặc chưa đóng phí | `vendor_snapshots.can_operate` |
| BR-05 báo giá không sửa | Chỉ `WITHDRAWN`; đổi giá là bản mới `revision_no + 1`; một báo giá SUBMITTED mỗi người bán mỗi yêu cầu (index) |
| BR-17 một báo giá thắng | Mọi thay đổi khóa dòng `quote_requests` (`SELECT … FOR UPDATE`); cọc thành công đóng các báo giá còn lại |
| L-10 bản chép ràng buộc | `snapshot` JSON chuẩn hóa (khóa sắp xếp) + SHA-256; trigger DB cấm sửa |

Class nặng: [QuoteRequestServiceImpl](../../archive/2026-11-08-class-docs/quotation/QuoteRequestServiceImpl.md), [QuoteServiceImpl](../../archive/2026-11-08-class-docs/quotation/QuoteServiceImpl.md), [QuoteAcceptanceServiceImpl](../../archive/2026-11-08-class-docs/quotation/QuoteAcceptanceServiceImpl.md).

## Dữ liệu người bán

quotation không gọi vendor-service: mọi thông tin người bán đọc từ `vendor_snapshots`, bản sao cập nhật từ sự kiện `vendor.updated`. Migration `V2026_10_26_0900` thêm `tax_code` vì bản chép ràng buộc phải ghi mã số thuế người bán. Trong lúc vendor-service chưa phát sự kiện, seed dev chép tay hai người bán mẫu (Trăng Vàng nhận đặt hàng từ 50 hộp, giao TP.HCM; Bánh Quê chờ duyệt).

## BE-01 (04/11/2026): relay + consumer đã nối cả hai chiều

Trước đây `quotation-service` là service **duy nhất** ghi vào outbox mà không có đường đọc ra —
nghĩa là đường tiền của đơn đặt hàng **bị đứt**: khách đã trả cọc nhưng không có đơn, acceptance
kẹt ở `PENDING_PAYMENT`, và không ai biết vì không có log lẫn metric.

Đã đóng cả hai chiều:

| Phần | Hiện trạng |
| --- | --- |
| **Relay (publish)** | `messaging/OutboxRelay.java` — cũ nhất trước, chỉ đánh dấu đã gửi sau publisher confirm, dừng tại event lỗi để giữ thứ tự. |
| **Consumer (subscribe)** | `messaging/PaymentEventListener.java` nghe `payment.succeeded` / `payment.failed` → `QuoteAcceptanceService.recordDepositPaid / recordDepositFailed`. |
| **Idempotency** | `InboxService.markProcessed(eventId, routingKey)` + bảng `processed_events` — lặp lại IPN không tạo trùng. |
| **Hạ tầng** | `config/RabbitConfig.java` — exchange `moonkage.events` + queue `quotation-service.payment-succeeded` / `.payment-failed`. |

Kịch bản đã chốt bằng test: IPN gửi **2 lần** → chỉ **1** acceptance chuyển `SUCCEEDED`,
không tạo trùng ledger; deposit đến **sau** `paymentExpiresAt` → refund `QUOTE_EXPIRED`.

## Chưa làm

- Consumer RabbitMQ: `vendor.updated`, `vendor.locked` → `vendor_snapshots`.
- 4 routing key ghi vào outbox nhưng chưa có consumer: `quote.submitted`, `quote.withdrawn`,
  `request.created`, `request.declined`. Cần chốt với team: **có chủ ý** (thì bổ sung consumer
  để orchestrator gửi notification) hay **không** (thì bỏ `enqueue` để khỏi ghi ra sự kiện
  không ai nghe)? Hiện chưa quyết — mất thông báo, **không mất tiền**.
- Tải logo (`POST /api/quote-requests/uploads`, bảng `request_logos`), xuất file (FR-18), đặt lại (FR-23), lịch công suất (FR-37).
- Gateway còn bắt đăng nhập cho `/api/suppliers`; thiết kế cho khách xem (K).
