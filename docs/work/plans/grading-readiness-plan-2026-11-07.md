# Kế hoạch tối ưu theo bảng chấm đồ án — 2026-11-07

> **Trạng thái:** Đề xuất (2026-11-07). Khi mọi hạng mục xong thì chuyển vào `archive/` theo [quy tắc 6](../../README.md).
> **Căn cứ:** bảng chấm đồ án `Template.xlsx` của môn học (sheet `Criteria` và `Guide`; không đưa vào repo vì chứa thông tin sinh viên của nhóm khác), lần chạy Flow 1 trên giao diện ngày 2026-11-07, kết quả e2e cùng ngày (48 qua · 1 lỗi · 2 bỏ qua).
> **Nhánh:** `fix/web-session-expiry-and-delivery` (tách từ `develop` @ `e68f303`), cùng commit với hai bản sửa web ở mục 7.

---

## 0. Tóm tắt

Bảng chấm có 3 thành phần: **Product 60%**, **Process & Document 20%**, **Presentation 20%**. Mỗi tiêu chí chấm thang 10 rồi nhân trọng số. Tiêu chí đánh dấu **(Y)** là bắt buộc.

Điểm tự đánh giá hiện tại (chưa tính Presentation):

| Thành phần | Hiện tại | Mục tiêu sau kế hoạch | Tiêu chí kéo điểm xuống |
|---|---|---|---|
| Product (60%) | ≈ 6.9 | ≈ 8.0 | **P6 = 4** (không có biểu đồ), P5 = 7 (VNPay sandbox lỗi 71) |
| Process & Document (20%) | ≈ 7.1 | ≈ 8.0 | **D6 = 4** (dữ liệu demo mỏng, có rác), D4 = 6, D5 = 5 |
| Presentation (20%) | — | — | Chưa có slide và kịch bản demo |

Có **12 hạng mục** chia **5 nhóm**, tổng ước lượng **9–13 ngày công**. Các nhóm phần lớn độc lập, nên chia được cho nhiều người làm song song.

| Nhóm | Hạng mục | Tiêu chí | Ước lượng | Ưu tiên |
|---|---|---|---|---|
| **A. Chặn demo** | A-1 VNPay · A-2 dữ liệu demo · A-3 ảnh sản phẩm | P5, P8, D6 | 2–3 ngày | **P0** |
| **B. Dashboard & báo cáo** | B-1 API thống kê · B-2 biểu đồ · B-3 trạng thái hệ thống thật | P6 | 3–4 ngày | **P0** |
| **C. Hoàn thiện UI/UX** | C-1 header khách · C-2 thuật ngữ & nhãn trạng thái · C-3 toast 401 còn lại · C-4 test e2e khiếu nại | P2, P3 | 2–3 ngày | **P1** |
| **D. Quy trình & tài liệu** | D-1 bảng đóng góp git · D-2 ERD tổng · D-3 triển khai cloud | D3, D4, D5 | 1–2 ngày (+ D-3 tuỳ chọn) | **P1** |
| **E. Trình bày** | E-1 kịch bản demo · E-2 slide & câu hỏi dự kiến | PE1, PE2 | 1 ngày | **P0** gần ngày bảo vệ |

> **Làm trước:** nhóm A và B. Hai nhóm này gỡ được hai điểm thấp nhất (D6 = 4, P6 = 4), và A-1 là điều kiện để demo P5 không phải giả lập IPN.

---

## 1. Nhóm A — Gỡ các điểm chặn demo

### A-1. Merchant VNPay sandbox (P5, P8) — P0

**Hiện trạng:** bấm "Thanh toán qua VNPay" thì sandbox trả `Payment/Error.html?code=71`. Lỗi 71 nghĩa là "website chưa được phê duyệt", tức VNPay không nhận `VNPAY_TMN_CODE` trong `.env`. Ngày 2026-11-07, Flow 1 phải ký IPN giả bằng tay mới đi tiếp được.

**Việc cần làm:**
1. Đăng ký lại merchant tại `sandbox.vnpayment.vn`, lấy `TmnCode` và `HashSecret` mới. Khai báo Return URL `http://localhost:5173/thanh-toan/ket-qua`.
2. Cập nhật `.env` (**không** commit secret), sửa `.env.example` nếu cần, ghi các bước vào [guides/getting-started.md](../../guides/getting-started.md).
3. Sandbox không gọi được IPN về `localhost`. Có hai cách, chọn một:
   - mở đường hầm (ngrok/cloudflared) tới gateway rồi đặt IPN URL trên cổng merchant; **hoặc**
   - thêm script dev `scripts/dev/fake-vnpay-ipn` ký IPN bằng `VNPAY_HASH_SECRET`. Đây chính là cách đã dùng hôm nay, hiện đang nằm tạm ở scratchpad.
4. Chạy lại Flow 1 trọn vẹn bằng thẻ test NCB.

**Xong khi:** thanh toán bằng thẻ test NCB tạo được đơn PAID mà không phải can thiệp tay.

### A-2. Dữ liệu demo đủ và sạch (D6) — P0

**Hiện trạng:** seed có 2 Shop (1 đã duyệt, 1 chờ duyệt), 6 tài khoản, khoảng 14 sản phẩm. Nhiều sản phẩm là rác do test tạo ra ("Bánh F1 222312", "Bánh UI F1 233602"…). Guide của D6 yêu cầu "tên rõ ràng, giá cả hợp lý, mô tả có thông tin, hình ảnh có liên quan" và đủ nhiều Product/Order để trình bày.

**Việc cần làm** (theo [guides/database.md](../../guides/database.md) §3, mỗi service sửa `db/seed/R__seed.sql` của chính nó):
1. **vendor-service:** thêm Shop để có ít nhất 5 Shop đã duyệt, rải ở Hà Nội, TP.HCM và Đà Nẵng. Có cả Shop bán lẻ và Shop chỉ nhận đặt hàng (BR-21), để Flow 2 có người nhận lời mời.
2. **Sản phẩm:** đủ các loại vỏ (nướng, dẻo, lạnh) và các nhân trong danh mục, giá từ 45.000đ đến 1.500.000đ, mô tả 2–3 câu, hạn dùng hợp lý. Khoảng 40 sản phẩm là đủ.
3. **order-service, payment-service:** trải khoảng 30–60 đơn quá khứ trên 4–6 tuần, đủ các trạng thái (PAID, SHIPPING, COMPLETED, CANCELLED, có khiếu nại). Biểu đồ ở nhóm B có số liệu thật nhờ phần này.
4. **Dọn dữ liệu rác:** chép một bước "làm sạch dữ liệu dev" vào `database.md`, gồm `docker compose down -v` rồi `up`. Test e2e tạo dữ liệu thì phải dùng tiền tố nhận ra được và tự dọn sau khi chạy.
5. **Tài khoản mẫu:** cập nhật bảng tài khoản trong `database.md`, ghi rõ vai trò của từng tài khoản trong kịch bản demo.

**Xong khi:** sau `down -v` → `up`, danh mục ở cả 3 tỉnh đều có sản phẩm thật, không còn sản phẩm tên "F1"/"UI F1".

### A-3. Ảnh sản phẩm (D6, P2) — P0

**Hiện trạng:** đã có cơ chế seed ảnh: `infra/minio/init.sh` chép `infra/minio/seed/products/<vendorId>/<file>` lên bucket. Nhưng mới có **1 ảnh**, và trên danh mục mọi thẻ sản phẩm đều hiện ô màu thay ảnh.

**Việc cần làm:**
1. Kiểm tra vì sao ảnh seed hiện có không lên giao diện: trường ảnh trong `ProductDto` của web, URL MinIO, CSP `img-src`.
2. Thêm ảnh có bản quyền rõ ràng (tự chụp, hoặc ảnh miễn phí bản quyền và ghi nguồn), mỗi sản phẩm seed 1–3 ảnh, nén dưới 300 KB.
3. Trỏ `cover image` trong seed vendor-service tới đúng tệp.

**Xong khi:** mọi sản phẩm seed hiện ảnh ở danh mục và trang chi tiết.

---

## 2. Nhóm B — Dashboard & báo cáo (P6)

Guide của P6 yêu cầu ba thứ: (1) số tổng hợp chính xác, (2) biểu đồ tỉ lệ (pie), diễn tiến theo thời gian (run chart), so sánh (bar/pareto), (3) giải thích được dữ liệu phát sinh lúc nào và truy vấn ra sao. Hiện trang tổng quan của quản trị và người bán **chỉ có thẻ đếm**, không có biểu đồ nào, và cũng chưa có API thống kê nào.

### B-1. API thống kê — P0

Đặt API ở service đang sở hữu dữ liệu, không thêm service mới (theo [architecture-standards.md](../../architecture/architecture-standards.md)):

| Endpoint (đề xuất) | Service | Trả về | Ai xem |
|---|---|---|---|
| `GET /api/orders/stats?from&to&vendorId` | order-service | số đơn và doanh thu theo ngày; số đơn theo trạng thái; top 5 sản phẩm theo doanh thu | Quản trị (toàn sàn) · Người bán (Shop của mình) |
| `GET /api/payments/stats?from&to` | payment-service | tiền đang giữ / đã trả / đã hoàn theo ngày | Quản trị |
| `GET /api/disputes/stats?from&to` | order-service | số khiếu nại theo kết quả | Quản trị |

- Người bán chỉ được xem Shop của mình, kiểm tra như các API người bán hiện có (D-19: chủ Shop không phải một vai riêng).
- Truy vấn gom nhóm trên bảng có sẵn (`orders`, `ledgers`, `payments`), không cần bảng mới. Ghi rõ câu truy vấn và mốc thời gian dùng để tính (ví dụ đơn được tính doanh thu khi nào: PAID hay COMPLETED) vào `docs/services/<service>/README.md`. Đây là ý (3) của Guide.
- Viết test cho phần gom nhóm (khoảng `from`/`to`, múi giờ Asia/Ho_Chi_Minh).

### B-2. Biểu đồ trên web — P0

- **Quản trị** (`pages/admin/overview`): run chart doanh thu 30 ngày · pie tỉ lệ trạng thái đơn · bar top 5 Shop theo doanh thu.
- **Người bán** (`pages/vendor/overview`): run chart đơn và doanh thu 30 ngày · bar top sản phẩm.
- Chọn thư viện: ưu tiên SVG tự vẽ hoặc một thư viện nhỏ, vì repo đang có `check-bundle-size.mjs`. Thêm thư viện mới thì phải ghi lý do vào PR.
- Biểu đồ phải qua được các kiểm tra sẵn có: `lint:contrast` (đủ tương phản ở cả theme sáng và tối) và `lint:responsive` (dùng được trên màn hình điện thoại).
- Đọc qua React Query (`queryKeys.order.stats(...)`), có trạng thái đang tải, lỗi và rỗng.

### B-3. Trạng thái hệ thống thật — P1

Dòng "Hệ thống Escrow & Cổng VNPAY: Hoạt động bình thường" ở `AdminOverviewPage.tsx` đang là **chữ cố định**. Có hai cách sửa: đọc `/actuator/health` qua gateway, hoặc bỏ hẳn dòng này. Khi bảo vệ, một chỉ số giả dễ bị hỏi vặn.

**Xong khi (B):** trang tổng quan quản trị có 3 biểu đồ, người bán có 2. Số trên biểu đồ khớp với truy vấn tay trên DB seed, và giải thích được trong 1 phút.

---

## 3. Nhóm C — Hoàn thiện UI/UX (P2, P3)

| ID | Việc | Hiện trạng | Xong khi |
|---|---|---|---|
| **C-1** | Header cho khách | Khách vẫn thấy "Đang đăng nhập: Khách (Người mua)", huy hiệu "Chưa NFC" và menu tài khoản có "Đăng xuất" (`widgets/header`) | Khách chỉ thấy nút "Đăng nhập / Đăng ký" |
| **C-2** | Thuật ngữ và nhãn trạng thái | Tab tiến độ đơn của người mua in mã trạng thái thô (`CONFIRMED`, `COMPLETED`). Giao diện còn lẫn "Escrow", "Maket" | Mọi trạng thái đều qua một bảng nhãn tiếng Việt; có bảng thuật ngữ trong `midfi-content-spec.md` |
| **C-3** | Toast lỗi khi hết phiên | Đã sửa trong client và `AddToCartButton`. Còn khoảng 46 chỗ `toast.error` sẽ hiện thêm toast lỗi riêng cạnh toast "hết phiên" | Mọi chỗ bắt lỗi đều bỏ qua `isSessionEnded(error)` (`@/shared/api`) |
| **C-4** | Test e2e khiếu nại | `flow-05-disputes` lấy đơn đầu tiên. `apiGet` ném lỗi khi gặp 404, nên test hỏng thay vì `test.skip` | `apiGet` có chế độ trả `null` khi 404. Test chọn đơn theo điều kiện, không chọn "đơn đầu tiên" |
| **C-5** | Khu vực mặc định | Mặc định Hà Nội. Với seed cũ, danh mục từng trống | Gộp với A-2: tỉnh mặc định luôn có sản phẩm, hoặc lần đầu vào thì hỏi khu vực |

---

## 4. Nhóm D — Quy trình & tài liệu (D3, D4, D5)

### D-1. Bảng đóng góp git (D4) — P1

`git shortlog` cho thấy commit dồn vào một người: Lam và các alias chiếm khoảng 180 commit, các thành viên khác mỗi người dưới 30, vài người chỉ 1–2. Guide của D4 kiểm tra commit của từng thành viên.

1. Gộp alias bằng `.mailmap` để số liệu đúng người (vì có nhiều email của cùng một người).
2. Lập bảng **thành viên → phần phụ trách → PR/commit tiêu biểu** trong `docs/guides/git-workflow.md` hoặc trong slide.
3. Từ giờ đến ngày bảo vệ, chia các hạng mục A–C cho đúng người phụ trách service, mỗi người tự mở PR của mình.

### D-2. ERD tổng (D3, bắt buộc) — P1

Đã có schema chi tiết theo service ở [api-db/](../../architecture/api-db/README.md) nhưng thiếu **một hình** để trình chiếu. Vẽ ERD mức khái niệm: các thực thể chính (Account, Vendor, Product, Order, Payment, Ledger, Request/Quote, Dispute) và ranh giới DB của từng service. Ghi rõ những chỗ tham chiếu chéo service chỉ bằng ID, không có khoá ngoại.

### D-3. Triển khai (D5) — tuỳ chọn

Guide chấm theo bậc: debug IDE → deploy local → deploy cloud → cloud có DevOps. Hiện ở bậc "local bằng Docker Compose, có CI". Muốn lên một bậc:

- Một máy ảo (VPS hoặc tài khoản cloud cho sinh viên) chạy chính `docker-compose.yml`, có reverse proxy và HTTPS. Đặt `MINIO_BROWSER_URL`, `CORS_ORIGINS`, `VNPAY_RETURN_URL` theo tên miền.
- Thêm workflow build image và deploy khi merge `main`, để lên bậc "có DevOps".
- Rủi ro: 7 service + 7 DB + RabbitMQ + MinIO cần nhiều RAM. Đo trước rồi mới chọn cấu hình máy.

---

## 5. Nhóm E — Trình bày (PE1, PE2)

### E-1. Kịch bản demo — P0

Bám đúng thứ tự Guide: **P4** (khởi tạo dữ liệu) → **P5** (luồng chính) → **P6** (báo cáo).

1. Quản trị duyệt Shop mới → người bán thêm sản phẩm → sản phẩm hiện ở danh mục (P4).
2. Flow 1: mua lẻ, thanh toán VNPay, giao, nhận, đánh giá (P5).
3. Flow 2: yêu cầu báo giá, đặt cọc, maket (P5, điểm khác biệt của đề tài).
4. Dashboard: số liệu thay đổi sau đơn vừa tạo (P6).

Mỗi bước có tài khoản, dữ liệu chuẩn bị sẵn và phương án dự phòng (ví dụ script IPN nếu VNPay sandbox không phản hồi). Diễn tập ít nhất 2 lần, có bấm giờ.

### E-2. Slide và câu hỏi dự kiến — P0

- Slide: bài toán → kiến trúc (một hình) → ERD (D-2) → demo → kết quả kiểm thử (số test, e2e) → hạn chế và hướng phát triển.
- Câu hỏi dự kiến: vì sao microservice; giao dịch phân tán giữa order và payment (outbox, IPN idempotent); bảo mật token (token vault, refresh); vì sao hoãn voucher; phân công thành viên (D-1).

---

## 6. Thứ tự và phân công đề xuất

| Tuần | Việc | Ghi chú |
|---|---|---|
| Ngày 1–2 | A-1, A-2, A-3 | Song song: một người lo VNPay, một người lo seed và ảnh |
| Ngày 3–5 | B-1 → B-2, B-3 | B-2 cần dữ liệu đơn từ A-2 |
| Ngày 4–6 | C-1 → C-5, D-1, D-2 | Song song với B |
| Ngày 7 | E-1, E-2, diễn tập | Chốt bản demo, tạm dừng tính năng mới |
| Tuỳ chọn | D-3 | Chỉ làm nếu A–C đã xong |

Mỗi hạng mục là một PR riêng, chạy đủ cổng như CI: `./mvnw clean verify` cho backend, `npm run check` và `npm run e2e` cho web.

---

## 7. Việc đã làm ngày 2026-11-07

| Việc | Tệp | Kiểm tra |
|---|---|---|
| Nút "Đã nhận hàng" vẫn hiện khi đơn đã COMPLETED: hook cập nhật cache chi tiết đơn của React Query và làm mới chi tiết, tiến độ, danh sách | `web/src/features/confirm-delivery/model/useConfirmDelivery.ts` (+ test) | Vitest · Chrome |
| 401 không đưa về trang đăng nhập: client phát tín hiệu hết phiên, tầng app chuyển tới `/dang-nhap` rồi quay lại trang cũ; 401 của endpoint `/api/auth/*` không còn bị coi là hết phiên | `web/src/shared/api/{client,sessionExpiry}.ts`, `web/src/app/providers/SessionExpiryHandler.ts`, `web/src/pages/auth/login/*`, `web/src/features/add-to-cart/ui/AddToCartButton.tsx` (+ test) | Vitest 223 test · e2e 48 qua · Chrome |
| Cấu hình máy dev: `.env` bổ sung `CORS_ORIGINS` cho `127.0.0.1:4173` (origin của e2e) theo `.env.example`; rebuild toàn bộ image backend vì image cũ hơn code | `.env` (không commit) | e2e |
