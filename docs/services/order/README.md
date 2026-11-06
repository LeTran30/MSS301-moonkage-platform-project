# Đơn hàng, giỏ và checkout (order-service)

order-service giữ giỏ hàng, phiên thanh toán (checkout), đơn hàng kèm maket, tiến độ, hóa đơn, khiếu nại và đánh giá. Đây là service **sở hữu đơn**: tiền của một đơn nằm ở payment-service, nhưng quyết định "đơn này được tạo, chuyển trạng thái, ai được chuyển tiền" thuộc order-service.

- Hợp đồng API + schema: [api-db/order.md](../../architecture/api-db/order.md). Khi tài liệu này lệch với `order.md`, `order.md` đúng.
- Quyết định liên quan: [api-db/decisions.md](../../architecture/api-db/decisions.md), đề xuất DB P-01 → P-04 ở [db-review-proposals.md](../../architecture/api-db/db-review-proposals.md).

## Trách nhiệm

**Có trách nhiệm**

- Giỏ hàng của người mua, tách theo Shop, kèm phí giao của từng Shop tới tỉnh đã chọn (FR-08).
- Phiên thanh toán: giữ hàng ở vendor, tạo lệnh thanh toán ở payment, chuyển checkout thành đơn khi thanh toán thành công (FR-09, BR-29).
- Đơn hàng mua ngay (`BUY_NOW`) và đơn đặt hàng theo báo giá (`CUSTOM_ORDER`), gồm dòng hàng, địa chỉ chép, thông tin hóa đơn DN (FR-10, FR-19).
- Maket (phiên bản, duyệt/yêu cầu sửa), tiến độ giao hàng, hóa đơn của người bán, khiếu nại và bằng chứng (FR-12, FR-20, FR-21, FR-25, FR-40, FR-44, FR-49).
- Đánh giá sản phẩm trong đơn đã giao (FR-11, BR-32).
- Khóa chuyển tiền cho payment-service (P-02).

**Không có trách nhiệm**

- Không giữ tiền. Sổ tiền theo đơn nằm ở payment-service (`ledgers`); payment-service tự ghi bản sao trạng thái đơn vào bảng `order_snapshots` của nó khi nhận sự kiện `order.*`.
- Không tạo thanh toán trực tiếp. Payment chỉ được tạo qua `POST /internal/payments` của payment-service, gọi bởi root nghiệp vụ sở hữu nó.
- Không giữ hàng. Hàng giữ nằm ở vendor-service (`stock_reservations`); order-service gọi qua `/internal/stock/reservations`.
- Không phí giao. Phí liên tỉnh tính ở catalog-service, order-service chỉ gọi `POST /internal/products/snapshot`.
- Không quyết định khiếu nại có được hoàn tiền hay không: admin quyết định, payment-service thực hiện hoàn (`refunds`).

## Bounded context và aggregate root

| Root | Tài nguyên con | Bảng | Đường dẫn gốc |
|---|---|---|---|
| Cart (mỗi người một giỏ) | items | `cart_items` | `/api/carts/me` |
| Checkout | — (kết quả tạo ra Order) | `checkouts`, `checkout_groups`, `checkout_lines` | `/api/checkouts` |
| Order | items, mockups, progress-updates, invoice, dispute (→ evidences), reviews, payments | `orders`, `order_items`, `mockup_versions`, `progress_updates`, `progress_update_photos`, `disputes`, `dispute_evidences`, `reviews` | `/api/orders` |
| Voucher | — | `vouchers` | (chưa có endpoint) |

Ba bảng kỹ thuật: `vendor_snapshots` (bản sao người bán), `processed_events` (inbox chống xử lý lặp), `outbox_events` (sự kiện phát).

### Trạng thái

| Đối tượng | Chuyển được |
|---|---|
| Checkout (`CheckoutStatus`) | `PENDING_PAYMENT → SUCCEEDED` (đã trả, đã chốt hàng), `→ FAILED` (cổng từ chối), `→ EXPIRED` (quá `expires_at`), `→ REFUND_REQUESTED` (đã trả tới trễ, hàng đã bán) |
| Đơn mua ngay (`OrderStatus`) | `PAID → CONFIRMED → SHIPPING → DELIVERED → COMPLETED` |
| Đơn đặt hàng (`OrderStatus`) | `DEPOSITED → AWAITING_MOCKUP_APPROVAL → IN_PRODUCTION → READY_TO_SHIP → DELIVERED → COMPLETED` |
| Khiếu nại (`DisputeStatus`) | `OPEN → RESOLVED`; quyết định: `FULL_REFUND`, `PARTIAL_REFUND`, `REJECTED` |
| Maket (`MockupReviewStatus`) | `PENDING_REVIEW → APPROVED` hoặc `→ CHANGES_REQUESTED` |

Chi tiết quy tắc chuyển trạng thái và hạn khiếu nại: [api-db/order.md](../../architecture/api-db/order.md).

## API công khai

Đọc danh tính từ header `X-Account-Id` / `X-User-Role` do gateway gắn. Mọi response bọc trong `ApiResponse<T>` (`status, code, message, data, timestamp`) của `common-api`.

Cột **Ai** dùng mã vai: **M** = `MEMBER` (người mua), **S** = người bán (chủ `vendor` của đơn, tra qua `GET /internal/vendors/by-owner/{accountId}` — chủ người bán **không phải một vai**, D-19), **A** = `ADMIN`, **K** = trang kết quả web (không cần token).

| Method, đường dẫn | Ai | Việc |
|---|---|---|
| `GET /api/carts/me?provinceCode=` | M | Giỏ tách theo Shop, kèm phí giao tới tỉnh đã chọn |
| `POST /api/carts/me/items` | M | Thêm sản phẩm vào giỏ |
| `PATCH /api/carts/me/items/{itemId}` | M | Đổi số lượng |
| `DELETE /api/carts/me/items/{itemId}` | M | Bỏ khỏi giỏ (204) |
| `POST /api/checkouts` | M | 201 — tạo checkout: giữ hàng, tạo lệnh thanh toán, trả `{checkoutId, paymentId, paymentUrl, totalAmount, expiresAt}` |
| `GET /api/checkouts/{checkoutId}` | M | Trạng thái checkout và id các đơn đã tạo |
| `GET /api/orders` | M, S, A | Đơn của mình; `vendorId=` đơn của Shop; `disputeStatus=OPEN` đơn đang khiếu nại (admin); `paymentGroupId=`, `kind=`, `status=`, `missingInvoice=` |
| `GET /api/orders/{orderId}` | M, S, A | Chi tiết đơn |
| `PATCH /api/orders/{orderId}` | S | Chuyển trạng thái đúng bước kế tiếp, `{status, trackingCode?, note?}`; ghi thêm một dòng tiến độ |
| `PATCH /api/orders/{orderId}` | M | `{receivedConfirmed: true}` — xác nhận đã nhận |
| `GET /api/orders/{orderId}/progress-updates` | M, S, A | Lịch sử tiến độ (chỉ đọc) |
| `POST /api/orders/{orderId}/payments` | M | 201 — trả phần còn lại của đơn đặt hàng → `{paymentId, paymentUrl}` |
| `POST /api/orders/uploads` | M, S | Xin presigned POST để tải maket, ảnh tiến độ, hóa đơn, bằng chứng |
| `GET /api/orders/{orderId}/mockups` | M, S | Danh sách phiên bản maket |
| `POST /api/orders/{orderId}/mockups` | S | 201 — người bán gửi phiên bản maket mới |
| `PATCH /api/orders/{orderId}/mockups/{versionNo}` | M | `{reviewStatus: APPROVED \| CHANGES_REQUESTED, reviewNote}` |
| `GET /api/orders/{orderId}/invoice` | M, S | Link tải hóa đơn của người bán |
| `PUT /api/orders/{orderId}/invoice` | S | Gắn file hóa đơn |
| `GET /api/orders/{orderId}/dispute` | M, S, A | Khiếu nại của đơn |
| `POST /api/orders/{orderId}/dispute` | M | 201 — mở khiếu nại (trong hạn khiếu nại) |
| `POST /api/orders/{orderId}/dispute/evidences` | M, S | 201 — gắn bằng chứng của mỗi bên |
| `PATCH /api/orders/{orderId}/dispute` | A | Quyết định của admin `{decision, refundAmount?, decisionReason}` |
| `GET /api/orders/{orderId}/reviews` | M | Đánh giá trong đơn |
| `POST /api/orders/{orderId}/reviews` | M | Tạo đánh giá sản phẩm của đơn mua ngay đã giao |

**Nội bộ** (gateway chặn `/internal/**`; trả dữ liệu không bọc):

| Method, đường dẫn | Ai gọi | Việc |
|---|---|---|
| `POST /internal/orders/{orderId}/payout-lock` | payment | Khoá dòng đơn để chuyển tiền (P-02); 200 khi được phép, 409 `DISPUTE_006` khi chưa |

## Dữ liệu

Schema do Flyway quản lý (`api/order-service/src/main/resources/db/migration`): `V1__baseline.sql` và `V2026_10_22_1000__align_with_api_db_outline.sql`.

| Bảng | Vai trò |
|---|---|
| `cart_items` | Giỏ của người mua; `(buyer_account_id, product_id)` duy nhất |
| `checkouts` | Phiên thanh toán: địa chỉ chép, thông tin hóa đơn DN, tổng tiền, `payment_id`, `expires_at`, trạng thái |
| `checkout_groups` | Mỗi Shop một dòng trong một checkout: `items_amount`, `shipping_fee`, `interprovince`, `order_id` cấp sẵn |
| `checkout_lines` | Dòng hàng của checkout, giá chép lúc tạo |
| `orders` | Đơn: `kind`, `buyer_account_id`, `vendor_id`, `payment_group_id`, `quote_id`, `agreement_id`/`agreement_hash`, tiền (`items_amount`, `shipping_fee`, `discount_amount`, `total_amount`, `deposit_amount`, `remaining_amount`), địa chỉ chép, `delivery_date`, `delivery_method`, `tracking_code`, `status`, `delivered_at`, `received_confirmed_at`, `complaint_deadline`, `payout_locked_at`, `version` (optimistic lock) |
| `order_items` | Dòng hàng của đơn (giá chép lúc đặt) |
| `mockup_versions` | Phiên bản maket; `(order_id, version_no)` duy nhất, không ghi đè |
| `progress_updates`, `progress_update_photos` | Lịch sử tiến độ (chỉ thêm) và ảnh kèm |
| `reviews` | Đánh giá sản phẩm; `(order_id, product_id)` duy nhất |
| `disputes` | Khiếu nại của đơn (mỗi đơn tối đa một `OPEN`) |
| `dispute_evidences` | Bằng chứng của từng bên (`BUYER` / `VENDOR`) |
| `vouchers` | Voucher nền tảng (FR-13, FR-52); hiện mới chỉ có bảng, chưa có endpoint dùng |
| `vendor_snapshots` | Bản sao người bán (`owner_account_id`, `business_name`, `status`, `can_operate`, `source_version`) từ sự kiện `vendor.updated` của vendor-service |
| `processed_events`, `outbox_events` | Inbox chống xử lý lặp và outbox phát sự kiện |

File chỉ lưu `object_key` của MinIO, không lưu URL (NFR-03); link tải được cấp bằng presigned GET.

## Sự kiện

Phát qua outbox, exchange `moonkage.events` (`api/order-service/src/main/java/com/moonkage/order/config/RabbitConfig.java`):

| Routing key | Người nghe |
|---|---|
| `order.created` | payment (`payment-service.order-events` → mở sổ tiền, `order_snapshots`) |
| `order.status_changed` | payment |
| `order.delivered` | payment |
| `order.received_confirmed` | payment |
| `dispute.opened` | payment (`payment-service.dispute-opened`) |
| `dispute.resolved` | payment (`payment-service.dispute-resolved`) |
| `mockup.uploaded`, `mockup.reviewed` | chưa có service nào bind — orchestrator chỉ nghe `orchestrator.email.#`, `orchestrator.inapp.#`, `audit.#` và các key `account.nfc_*` |
| `invoice.attached` | chưa có service nào bind (như trên) |
| `review.created` | catalog (`catalog.projections` → đánh giá và điểm sản phẩm) |

Lưu ý: các routing key `order.*`, `dispute.*`, `mockup.*`, `invoice.*` **không** khớp mẫu nào orchestrator-service đang bind, nên hiện **không** sự kiện nào của order-service tới được hộp thư hay nhật ký kiểm toán. Xem mục "Chưa làm" của [orchestrator/README.md](../orchestrator/README.md).

Nghe (queue bền, mỗi sự kiện một queue riêng):

| Queue | Routing key | Xử lý |
|---|---|---|
| `order-service.payment-succeeded` | `payment.succeeded` | `purpose=CHECKOUT` → chốt hàng, tạo đơn; `purpose=REMAINDER` → đóng phần còn lại của đơn đặt hàng |
| `order-service.payment-failed` | `payment.failed` | `purpose=CHECKOUT` → đóng checkout, trả hàng |
| `order-service.quote-accepted` | `quote.accepted` | Tạo đơn đặt hàng từ bản chép chấp nhận (id đơn = `acceptanceId`) |

Chống xử lý lặp bằng bảng `processed_events` (`InboxService.markProcessed`).

## Phụ thuộc

| Service | Gọi qua | Mục đích |
|---|---|---|
| catalog | Feign `CatalogClient` → `POST /internal/products/snapshot` | Tính phí giao của đơn mua ngay (D-14) |
| vendor | Feign `VendorClient` → `POST /internal/stock/reservations`, `POST /internal/stock/reservations/{checkoutId}/commit`, `DELETE /internal/stock/reservations/{checkoutId}`, `GET /internal/vendors/by-owner/{accountId}` | Giữ hàng, chốt hàng, trả hàng; tra xem tài khoản này sở hữu vendor nào (chủ người bán không phải vai, D-19) |
| payment | Feign `PaymentClient` → `POST /internal/payments` (header `Idempotency-Key`), `POST /internal/refunds` | Tạo thanh toán checkout / phần còn lại, yêu cầu hoàn tiền `LATE_PAYMENT` |

`IdentityClient` và `QuotationClient` **khai báo** trong code (`api/order-service/src/main/java/com/moonkage/order/client/`) nhưng hiện **không có method nào** — order-service không gọi identity hay quotation qua HTTP; nó nhận `quote.accepted` qua RabbitMQ.

## Cấu hình và chạy local

Cổng `8084`, database `order_db` (`ORDER_DB_HOST` / `ORDER_DB_PORT`, mặc định `localhost:5444`). Biến lấy từ `.env` ở thư mục gốc repo (xem [../../../.env.example](../../../.env.example)).

| Biến / khóa | Ghi chú |
|---|---|
| `ORDER_DB_HOST`, `ORDER_DB_PORT` | `order_db` |
| `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD` | Broker sự kiện |
| `EUREKA_URL` | `http://localhost:8761/eureka/` |
| `MINIO_ORDER_ACCESS_KEY`, `MINIO_ORDER_SECRET_KEY` | User MinIO riêng của order-service; chỉ chạm được `<private>/order/` và `<private>/tmp/order/` |
| `MINIO_PUBLIC_BUCKET`, `MINIO_PRIVATE_BUCKET` | Bucket ảnh công khai và file riêng tư |
| `MINIO_UPLOAD_LINK_LIFETIME`, `MINIO_DOWNLOAD_LINK_LIFETIME` | Mặc định `10m` |
| `ORDER_FILE_ALLOWED_CONTENT_TYPES`, `ORDER_FILE_MAX_SIZE` | Mặc định `image/jpeg,image/png,application/pdf`; `20MB` |
| `order.file.key-prefix` | Cố định `order` — phải khớp với policy `infra/minio/init.sh` cấp cho user MinIO của order-service |
| `order.payment-lifetime` | `15m` — hạn thanh toán VNPay của một checkout |
| `order.checkout-grace` | `5m` — độ trễ giữ hàng sau hạn thanh toán |
| `order.checkout-expiry-sweep-interval` | `60s` — nhịp quét checkout quá hạn (`CheckoutExpiryJob`) |
| `order.complaint-window-local`, `order.complaint-window-other` | `3d` / `7d` — hạn khiếu nại sau giao (D-13, Q-10) |

Chạy:

```bash
cd api
./mvnw -pl order-service -am spring-boot:run
```

Trên Windows dùng `mvnw.cmd`. Cần Postgres `order_db`, RabbitMQ và MinIO đã bật (xem [../../guides/getting-started.md](../../guides/getting-started.md)); order-service cần `common-storage` nên nó kiểm tra quyền MinIO lúc khởi động và **dừng** nếu user chưa được `minio-init` cấp.

## Kiểm thử

```bash
cd api
./mvnw -pl order-service -am clean verify
```

Test tích hợp dùng Testcontainers (PostgreSQL, RabbitMQ); cần Docker.
