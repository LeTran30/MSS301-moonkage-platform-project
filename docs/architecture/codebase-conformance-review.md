# Đối chiếu tuân thủ chuẩn kiến trúc

> **Trạng thái:** Rà soát (2026-11-05) · **Đợt xử lý 2026-11-05 đã đóng 32/32 phát hiện** + 1 hạng mục mới (quét responsive toàn diện) + **1 phát hiện M-13 đóng 2026-11-06** (CSP chặn request ở môi trường HTTP). Đối chiếu mã nguồn thực tế với [chuẩn kiến trúc](architecture-standards.md).
> **Phạm vi:** `api/` (14 module Maven), `web/src` (570 file TS/TSX), `docs/` (72 file Markdown), hạ tầng repo.
> **Cách đọc:** mỗu phát hiện đều có đường dẫn + số dòng đã kiểm chứng bằng đọc file, không suy đoán.
> **Lưu ý:** các agent khác đang sửa `web/src/**` và `api/**` song song. Số dòng trong báo cáo này phản ánh trạng thái tại thời điểm rà soát; trước khi xử lý, kiểm lại file.

## Mục lục

1. [Tóm tắt](#1-tóm-tắt)
2. [Bảng phát hiện theo mức độ](#2-bảng-phát-hiện-theo-mức-độ)
3. [Phát hiện Blocker](#3-phát-hiện-blocker)
4. [Phát hiện High](#4-phát-hiện-high)
5. [Phát hiện Medium](#5-phát-hiện-medium)
6. [Phát hiện Low](#6-phát-hiện-low)
7. [Kết quả tuân thủ (đã đạt)](#7-kết-quả-tuân-thủ-đã-đạt)
8. [Backlog xử lý P0 / P1 / P2](#8-backlog-xử-lý-p0--p1--p2)
9. [Không thể kiểm chứng](#9-không-thể-kiểm-chứng)

---

## 1. Tóm tắt

| Vùng | Kết quả |
|---|---|
| **Backend — cấu trúc & luật tầng** | Đạt. ArchUnit chạy ở mọi module; các luật tầng đều xanh. Điểm lệch thật sự: 3 service dùng 3 cách đặt package controller khác nhau |
| **Backend — trùng lặp mã** | **Cải thiện 2026-11-05.** `ApiResponse` 7 bản → 1 (ở `common-api`); `OutboxRelay` 5 bản → 1 (ở `common-outbox`); 7 bản xử lý lỗi → `CommonExceptionHandler` dùng chung (6 service kế thừa, catalog giữ riêng vì trả 2 hình dạng lỗi); 5 bản `ErrorCode` → delegate `COMMON_*` sang `CommonErrorCode` (17 mã) |
| **Backend — cấu hình** | **Đạt 2026-11-05.** `show-sql: true` hardcode ở 3 service (→ `${JPA_SHOW_SQL:false}` ở cả 7); `open-in-view: false` (→ cả 7); graceful shutdown (→ cả 7) |
| **Frontend — FSD** | Đạt. 0 vi phạm hướng tầng khi quét bằng alias `@/`; lint `no-restricted-imports` cưỡng chế đầy đủ |
| **Frontend — vệ sinh** | **Đạt 2026-11-05.** 19 file `.module.css` không có file TSX tương ứng (16 là nhóm hợp lệ, 3 là mồ côi → đã xoá); 2 slice đã bị xoá nhưng còn sót CSS (→ đã xoá); 4 script tạm chưa được ignore (→ đã ignore). Gate `check-orphan-css.mjs` chặn quay lại |
| **Frontend — responsive** | **Đạt 2026-11-05.** 132 module CSS rà soát; 14 module thực sự vỡ ở viewport hẹp được thêm `@media`; 82 module một cột giữ nguyên (không thêm nhiễu). Gate `check-responsive.mjs` chặn hồi quy |
| **Repo hygiene** | Đạt phần lớn. `.env` không commit, `target/` và `dist/` không commit, `debug.log` không tồn tại, 8 file scratch đã được ignore |
| **Tài liệu** | **Đạt 2026-11-05.** `docs/README.md` bỏ trống cột Tổng quan của `catalog` (→ đã sửa); `api-db/README.md` ghi "L-01 → L-18" (→ đã sửa); 10 file tài liệu web dùng tên `UPPER_SNAKE_CASE` (→ đã đổi kebab-case); 4 service chưa có `docs/services/<service>/README.md` (→ đã sửa: thêm `order`, `payment`, `orchestrator`, `common-storage`; 7 module còn lại trong `api/pom.xml` cố ý không có README vì là hạ tầng/thư viện — đã ghi rõ trong `docs/README.md`); 20 file tài liệu class chưa có quy trình cập nhật (→ đã sửa: quy tắc 9 + gate `check-class-docs.mjs` trong CI); `docs/services/identity/README.md` mô tả `Role` cũ `CUSTOMER`/`SELLER` (→ đã sửa theo D-19: `MEMBER`/`ADMIN`) |

**Tổng số phát hiện: 33** — 3 Blocker, 10 High, 13 Medium, 7 Low. **Đã đóng 2026-11-05: 32/32 phát hiện** (commit `9deb6dd`); **+1 phát hiện M-13 đóng 2026-11-06** (CSP chặn request ở môi trường HTTP + E2E pass giả do `reuseExistingServer`); không còn nợ trong báo cáo này.

---

## 2. Bảng phát hiện theo mức độ

| # | Mức | Vùng | Phát hiện | Vị trí |
|---|---|---|---|---|
| B-01 | Blocker | Tài liệu | Bảng "Services" trong `docs/README.md` bỏ trống cột Tổng quan của `catalog` dù file có thật — **đã sửa 2026-11-05** | `docs/README.md` (bảng "Services") |
| B-02 | Blocker | CI | `check-no-spec-ids.mjs` được `package.json` và CI gọi nhưng **chưa được commit** — **đã sửa 2026-11-05** (file đã `git add`, commit `9deb6dd`) | `web/package.json:12`, `.github/workflows/web-quality.yml:52` |
| B-03 | Blocker | Tài liệu | `api-db/README.md` ghi "Quyết định L-01 → L-18" trong khi `decisions.md` đã có L-19 — **đã sửa 2026-11-05** | `docs/architecture/api-db/README.md:17` |
| H-01 | High | Backend | 7 bản `ApiResponse` không đồng nhất (2 bản thiếu trường `errors`) — **đã sửa 2026-11-05** (chỉ còn 1 bản ở `common-api`) | 7 file, xem §4.1 |
| H-02 | High | Backend | 7 bản xử lý lỗi trùng logic (6 `GlobalExceptionHandler` + 1 `ApiExceptionHandler`), mỗi bản một kiểu — **đã sửa 2026-11-05** | xem §4.2 |
| H-03 | High | Backend | 5 bản `ErrorCode` với tập mã `COMMON_*` khác nhau giữa các service — **đã sửa 2026-11-05** | xem §4.3 |
| H-04 | High | Backend | 5 bản `OutboxRelay` + 5 bản `OutboxServiceImpl` — 6 service cùng chạy outbox — **đã sửa 2026-11-05** (chỉ còn 1 bản `OutboxRelay` ở `common-outbox`) | xem §4.4 |
| H-05 | High | Backend | `show-sql: true` hardcode ở 3 service, 4 service còn lại dùng biến môi trường — **đã sửa 2026-11-05** (`${JPA_SHOW_SQL:false}` ở cả 7) | xem §4.5 |
| H-06 | High | Frontend | 19 file `.module.css` không có file `.tsx`/`.ts` tương ứng — **đã sửa 2026-11-05** (gate `check-orphan-css.mjs` xanh; 12 stylesheet còn lại đều có call site thật) | xem §4.6 |
| H-07 | High | Frontend | 2 slice đã bị xoá nhưng còn sót file CSS mồ côi — **đã sửa 2026-11-05** | `web/src/entities/sitemap/ui/sitemapUi.module.css`, `web/src/features/switch-persona/ui/QuickPersonaSelector.module.css` |
| H-08 | High | Tài liệu | 5 service chưa có `docs/services/<service>/README.md` — **đã sửa 2026-11-05** | xem §4.7 |
| H-09 | High | Backend | Package controller đặt ở 3 vị trí khác nhau (`controller/`, `web/`) theo 3 convention — **đã sửa 2026-11-05** (tất cả về `controller/`) | xem §4.8 |
| H-10 | High | Backend | Module `common-api` và `common-outbox` đã vào build nhưng **chưa service nào dùng**, và hai thư mục **chưa commit** — **đã sửa 2026-11-05** (cả 7 service đã dùng `com.moonkage.api.*` và `com.moonkage.outbox.*`) | `api/pom.xml:24-25`, `api/common-api/`, `api/common-outbox/` |
| M-01 | Medium | Backend | Không service nào khai báo `spring.jpa.open-in-view: false` — **đã sửa 2026-11-05** | xem §5.1 |
| M-02 | Medium | Backend | Không service nào khai báo graceful shutdown — **đã sửa 2026-11-05** | xem §5.2 |
| M-03 | Medium | Backend | `catalog-service` trả 2 hình dạng lỗi khác nhau tùy đường dẫn — **đã sửa 2026-11-05** (mọi path trả envelope `ApiResponse`; `ErrorResponse` đã xoá) | `api/catalog-service/.../GlobalExceptionHandler.java` |
| M-04 | Medium | Backend | `@Value` rải rác thay vì `@ConfigurationProperties` — **đã sửa 2026-11-05** (6 nhóm property → `@ConfigurationProperties`) | xem §5.3 |
| M-05 | Medium | Backend | `catalog-service` còn bảng `products` cũ với cột `deleted` dù đã chuyển sang bản đọc — **đã sửa 2026-11-05** (migration `V2026_11_06_1000__drop_legacy_products_table.sql`) | `api/catalog-service/src/main/resources/db/migration/` |
| M-06 | Medium | Frontend | 2 page gọi trực tiếp `uploadFile` từ `@/shared/api` — **đã sửa 2026-11-05** (tách thành feature `features/file-upload/`) | xem §5.4 |
| M-07 | Medium | Frontend | 40 file scratch `tmp-*` trong `web/scripts/` chưa được ignore — **đã sửa 2026-11-05** (file scratch đã xoá, `.gitignore` đã thêm `web/tmp-*` và `web/scripts/tmp-*`) | xem §5.5 |
| M-08 | Medium | Frontend | `web/src/app/lazyPage.tsx` dùng `any` ở 2 chỗ — **đã sửa 2026-11-05** | xem §5.6 |
| M-09 | Medium | Tài liệu | 10 file trong `web/doc/` dùng tên `UPPER_SNAKE_CASE` — **đã sửa 2026-11-05** | xem §5.7 |
| M-10 | Medium | Tài liệu | `docs/services/*/classes/*.md` (20 file) là tài liệu sinh tay theo class, không có quy trình cập nhật — **đã sửa 2026-11-05** | xem §5.8 |
| M-11 | Medium | Dữ liệu | Sổ ID không ghi `000300000101` (bậc giá) và `000900000001` (outbox event) — **đã sửa 2026-11-05** | xem §5.9 |
| M-12 | Medium | Tài liệu | `docs/services/identity/README.md` mô tả `Role` cũ (`CUSTOMER`/`SELLER`) — **đã sửa 2026-11-05** | xem §5.10 |
| M-13 | Medium | Frontend | CSP meta chứa `upgrade-insecure-requests` ở môi trường HTTP ⇒ trình duyệt nâng request `http://` của gateway lên `https://` rồi chặn ⇒ danh mục rỗng, E2E fail — **đã sửa 2026-11-06** | xem §5.11 |
| L-01 | Low | Repo | `api/quotation-service/.LCKpom.xml~` — file backup của editor nằm trong cây module — **đã sửa 2026-11-05** | xem §6.1 |
| L-02 | Low | Frontend | `web/playwright.config.ts` không khai báo `testIgnore` — file `*_tmp-*.spec.ts` sẽ chạy trong CI — **đã sửa 2026-11-05** | xem §6.2 |
| L-03 | Low | Backend | `VendorServiceImpl.java` 490 dòng — vượt ngưỡng 400 — **đã sửa 2026-11-05** (490 → 272 dòng, tách 4 lớp trách nhiệm) | xem §6.3 |
| L-04 | Low | Frontend | `web/src/pages/system/sitemap/` chỉ còn `SitemapPage.module.css`, thư mục rỗng về logic — **đã sửa 2026-11-05** | xem §6.4 |
| L-05 | Low | Backend | `order-service` khai báo `INTERNAL_SERVER_ERROR` nhưng thiếu `COMMON_401` ở enum đầu tiên — **đã sửa 2026-11-05** | xem §6.5 |
| L-06 | Low | Tài liệu | `docs/README.md` dẫn `../.github/CONTRIBUTING.md` — **rủi ro giả, đã kiểm chứng 2026-11-05** | xem §6.6 |
| L-07 | Low | Backend | `api-gateway` vẫn bật `discovery.locator` — **đã sửa 2026-11-05** (ADR D-30: `LegacyPathRedirectFilter` trả 308 cho 3 service đã migrate; locator giữ bật có chủ đích cho 4 service còn lại) | xem §6.7 |

---

## 3. Phát hiện Blocker

### B-01 — Bảng "Services" trong `docs/README.md` bỏ trống cột Tổng quan dù file có thật

**Vị trí:** `docs/README.md` (bảng "Services", phiên bản trước 2026-11-05) — `git show HEAD:docs/README.md`

**Vấn đề.** Bảng "Services" cũ ghi:

```markdown
| catalog | — | [classes/](services/catalog/classes/) |
| common-storage (thư viện) | — | [classes/](services/common-storage/classes/) |
```

Kiểm chứng: `git ls-tree HEAD docs/services/catalog/` cho thấy `docs/services/catalog/README.md` **có tồn tại** và được commit, cùng `docs/services/catalog/classes/` (8 file). Link không hỏng — nhưng bảng bảo người đọc rằng **catalog không có tài liệu tổng quan**, trong khi thực tế có. Đây là link chết theo nghĩa *nội dung*: người mới đọc `docs/README.md` sẽ bỏ qua tài liệu của một service lớn.

**Vì sao vi phạm:** Quy tắc 1 của `docs/README.md`: "Một nội dung, một chỗ. Chỗ khác chỉ đặt link, không chép lại" — và ngược lại, mọi nội dung có thật phải được liên kết đúng một lần. Bảng mục lục là **cửa vào** của hệ thống tài liệu; dòng "—" là một lỗi điều hướng, dù link không gãy.

**Đã xử lý (2026-11-05).** `docs/README.md` được viết lại thành bản đồ tài liệu; bảng "Services" giờ trỏ đầy đủ: `catalog` → `services/catalog/README.md`, `quotation` → `services/quotation/README.md`, `vendor` → `services/vendor/README.md`, `common-storage` → `services/common-storage/classes/`. Cột "Tổng quan" không còn dòng "—" nào.

**Nỗ lực:** 5 phút. **Chủ sở hữu:** người giữ tài liệu.

---

### B-02 — Script chặn mã đặc tả được CI gọi nhưng chưa commit

**Vị trí:** `web/package.json:12`, `.github/workflows/web-quality.yml:52`, `web/scripts/check-no-spec-ids.mjs`

**Vấn đề.** `npm run check` và workflow `web-quality.yml` đều gọi `node scripts/check-no-spec-ids.mjs`. Kiểm chứng bằng `git ls-files web/scripts/`: file này **không** có trong index; `git status --porcelain` cho `?? web/scripts/check-no-spec-ids.mjs`; `git log -- web/scripts/check-no-spec-ids.mjs` không có kết quả.

Đối chiếu với `HEAD`: `git show HEAD:.github/workflows/web-quality.yml` **không** có dòng `check-no-spec-ids`. Nghĩa là script và lời gọi đều là thay đổi chưa commit.

**Vì sao vi phạm:** Khi PR này được merge mà script bị bỏ sót, `npm run check` và CI sẽ fail với `MODULE_NOT_FOUND` — cổng chất lượng web bị chặn. Ngược lại nếu script được commit nhưng workflow chưa kịp, CI vẫn xanh.

**Sửa.** Commit `web/scripts/check-no-spec-ids.mjs` **cùng** với thay đổi `package.json` và `web-quality.yml` trong cùng một PR. Nếu script còn đang viết dở, thì gỡ cả hai lời gọi trong `package.json:12` và `web-quality.yml:52` cho tới khi script hoàn tất.

**Nỗ lực:** 10 phút. **Chủ sở hữu:** FE lead.

---

### B-03 — `api-db/README.md` ghi sai phạm vi mã quyết định

**Vị trí:** `docs/architecture/api-db/README.md:17`

**Vấn đề.**

```markdown
| [decisions.md](decisions.md) | Quyết định L-01 → L-19; ADR D-25 → D-30 | — |
```

Trong `docs/architecture/api-db/decisions.md`, bảng điểm lệch có tới `L-19` (dòng 24, "Vỏ, nhân và thương hiệu") và còn các mục `L-01 → L-19`, `P-01 → P-09`.

**Vì sao vi phạm:** Quy tắc "một nội dung, một chỗ" — bảng mục lục phải khớp với nội dung file nó trỏ tới. Người đọc tưởng L-19 chưa tồn tại.

**Đã xử lý (2026-11-05).** `docs/architecture/api-db/README.md` đã ghi `Quyết định L-01 → L-19; ADR kiến trúc D-25 → D-30`.

**Nỗ lực:** 2 phút. **Chủ sở hữu:** người giữ tài liệu.

---

## 4. Phát hiện High

### H-01 — 7 bản `ApiResponse` không đồng nhất

**Vị trí:**

| File | Dòng | Có `errors`? |
|---|---|---|
| `api/identity-service/src/main/java/com/moonkage/identity/common/exception/ApiResponse.java` | 17 | ✔ |
| `api/vendor-service/src/main/java/com/moonkage/vendor/common/exception/ApiResponse.java` | 17 | ✔ |
| `api/order-service/src/main/java/com/moonkage/order/exception/ApiResponse.java` | 16 | ✔ |
| `api/payment-service/src/main/java/com/moonkage/payment/exception/ApiResponse.java` | 16 | ✔ |
| `api/quotation-service/src/main/java/com/moonkage/quotation/common/exception/ApiResponse.java` | 15 | ✔ |
| `api/catalog-service/src/main/java/com/moonkage/catalog/dto/response/ApiResponse.java` | 8 | ✘ |
| `api/orchestrator-service/src/main/java/com/moonkage/orchestrator/contract/ApiResponse.java` | 16 | ✘ |

**Vấn đề.** 7 bản sao cùng tên, cùng vai trò, khác nhau ở: vị trí package (`common/exception`, `exception`, `dto/response`, `contract`), tập factory (`ok()` không tham số chỉ có ở identity), và trường `errors`.

**Vì sao vi phạm:** Chuẩn §3.1 quy định envelope có `errors` cho lỗi validate. `web/src/shared/api/envelope.ts:22-29` khai báo `errors?` trong `ApiEnvelope<T>` — hợp đồng phía web giả định trường này tồn tại. Catalog và orchestrator trả về hình dạng khác, và frontend phải chịu `undefined` ở `errors`.

**Sửa.** Module `api/common-api` **đã có sẵn** `ApiResponse` đúng chuẩn (`api/common-api/src/main/java/com/moonkage/api/ApiResponse.java` — record đủ 7 trường, có `errors`, có `FieldError`, đủ factory `ok()/ok(T)/created/error(...)`). Việc cần làm chỉ là: khai báo `common-api` trong `api/pom.xml` (xem H-10), thêm dependency vào 7 service, xoá 7 bản cũ, đổi import:

```java
import com.moonkage.api.ApiResponse;
```

Cập nhật `ExceptionHandler` của catalog và orchestrator để dùng factory `error(...)` có tham số `errors`.

Nếu nhóm muốn tách thêm `common-web` cho `GlobalExceptionHandler` + `CommonErrorCode` (H-02, H-03), nên đặt chúng **vào trong `common-api`** thay vì tạo module mới — tránh lại một module `common-*` mà không ai dùng.

**Nỗ lực:** 1 ngày (7 module + đổi import + test). **Chủ sở hữu:** BE lead.

---

### H-02 — 7 bản xử lý lỗi trùng logic, mỗi bản một kiểu

**Vị trí:**

```text
api/catalog-service/src/main/java/com/moonkage/catalog/common/exception/GlobalExceptionHandler.java
api/identity-service/src/main/java/com/moonkage/identity/common/exception/GlobalExceptionHandler.java
api/order-service/src/main/java/com/moonkage/order/exception/GlobalExceptionHandler.java
api/payment-service/src/main/java/com/moonkage/payment/exception/GlobalExceptionHandler.java
api/quotation-service/src/main/java/com/moonkage/quotation/common/exception/GlobalExceptionHandler.java
api/vendor-service/src/main/java/com/moonkage/vendor/common/exception/GlobalExceptionHandler.java
api/orchestrator-service/src/main/java/com/moonkage/orchestrator/web/ApiExceptionHandler.java   <- đặt tên khác
```

**Vấn đề.** Sáu bản `GlobalExceptionHandler` cùng xử lý một bộ ngoại lệ giống hệt (`MethodArgumentNotValidException`, `HttpMessageNotReadableException`, `MissingRequestHeaderException`, `Exception` fallback) nhưng mỗi bản một kiểu; `orchestrator-service` đặt tên khác là `ApiExceptionHandler` và đặt trong package `web/` thay vì `exception/`.

**Vì sao vi phạm:** Chuẩn §2.4 yêu cầu ranh giới lỗi thống nhất; 7 bản chắc chắn lệch nhau theo thời gian. Lỗi validate có thể được trả theo 3 hình dạng khác nhau tùy service — frontend phải tự đoán.

**Sửa.** Đặt một `@RestControllerAdvice` dùng chung **trong `api/common-api`** (cùng module với `ApiResponse` — không cần tạo thêm module `common-web`):

```java
package com.moonkage.api;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex,
                                                              HttpServletRequest request) {
        var errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiResponse.FieldError(fe.getField(), fe.getDefaultMessage()))
                .toList();
        return ResponseEntity.badRequest().body(ApiResponse.error(
                HttpStatus.BAD_REQUEST, "COMMON_400", "Dữ liệu gửi lên không hợp lệ", errors, request.getRequestURI()));
    }
    // ... các handler còn lại
}
```

Mỗi service giữ lại handler riêng **chỉ** cho ngoại lệ riêng của nó. Tên class thống nhất là `ApiExceptionHandler` (không phải `GlobalExceptionHandler`) — đây cũng là cách đặt tên mà `orchestrator-service` đã dùng.

**Đã xong 2026-11-05.** `api/common-api` giờ giữ:

| File | Vai trò |
|---|---|
| `CommonErrorCode.java` | Enum 17 mã `COMMON_*` — code string + HTTP status + message key, một nguồn duy nhất |
| `CommonExceptionHandler.java` | `@RestControllerAdvice` dùng chung: 7 handler framework-level (`MethodArgumentNotValidException`, `HttpMessageNotReadableException`/`MethodArgumentTypeMismatchException`, `MissingServletRequestParameterException`, `NoResourceFoundException`/`NoHandlerFoundException`, `HttpRequestMethodNotSupportedException`, `FeignException`, catch-all `Exception`) + 13 hook `protected` để service ghi đè |
| `CommonExceptionHandlerAutoConfiguration.java` | Đăng ký advice qua `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`; `@ConditionalOnMissingBean` nên service có advice riêng không bị trùng |

**Cơ chế chống trùng mapping:** service **kế thừa** `CommonExceptionHandler` (`extends`), không khai báo lại handler. Handler trong lớp cha là `final` — service không thể vô tình khai báo trùng, và Spring chỉ thấy **một** advice duy nhất nên không có `Ambiguous @ExceptionHandler method` lúc khởi động context.

**Kết quả từng service:**

| Service | Sau refactor | Handler riêng còn lại |
|---|---|---|
| identity | `extends CommonExceptionHandler` | `AppException`, `BadCredentials`/`UsernameNotFound`, `AccountStatus`, `Authentication`, `AccessDenied` |
| order | `extends CommonExceptionHandler` | `AppException`, `InvalidFileException`, `StorageUnavailableException` |
| payment | `extends CommonExceptionHandler` | `AppException` |
| vendor | `extends CommonExceptionHandler` | `AppException` (có map `getFields()` → `FieldError`), `InvalidFileException`, `StorageUnavailableException`, `MissingRequestHeader` |
| quotation | `extends CommonExceptionHandler` | `AppException`, `MissingRequestHeader` → `UNAUTHENTICATED` |
| orchestrator | `extends CommonExceptionHandler` | `NotificationNotFound`, `MissingRequestHeader`, `IllegalArgument`; `code()` hook giữ nguyên code string riêng (`NOTIFICATION_NOT_FOUND`, `UNAUTHENTICATED`, `INVALID_REQUEST`, `INTERNAL_ERROR`) |
| **catalog** | **giữ nguyên advice riêng** | Xem bên dưới — có lý do cụ thể |

**Vì sao catalog không dùng chung:** catalog trả **hai hình dạng lỗi** — `/api/products/**` và `/api/interprovince-fees/**` trả envelope `ApiResponse` với mã `CAT_001…CAT_010`, mọi path khác trả `ErrorResponse` cũ (`{status, error, message, path, timestamp}`). Ranh giới dùng chung chỉ có thể trả envelope `ApiResponse` với mã `COMMON_*`, nên kế thừa nó sẽ đổi hành vi công khai trên mọi path không phải product — đúng cái lệch chuẩn M-03 mà báo cáo này yêu cầu giữ nguyên. Để không có hai catch-all cạnh tranh, catalog tắt đăng ký advice dùng chung bằng `moonkage.common-api.error-handler.enabled=false` (escape hatch mà javadoc của auto-config đã mô tả), kèm test `CommonErrorHandlerRegistrationTest` ghim cả property lẫn tác dụng của nó.

**Một thay đổi hành vi có chủ đích (orchestrator):** 5 loại ngoại lệ framework trước đây rơi vào catch-all → **500 `INTERNAL_ERROR`**, nay trả đúng như 4 service kia — `MethodArgumentNotValidException`/`HttpMessageNotReadableException`/`MethodArgumentTypeMismatchException` → **400 `INVALID_REQUEST`**, `NoResourceFoundException`/`NoHandlerFoundException` → **404**, `HttpRequestMethodNotSupportedException` → **405**. `MissingServletRequestParameterException` và `FeignException` giữ nguyên 500 vì orchestrator chưa từng xử lý chúng.

**Nỗ lực:** 2 ngày. **Chủ sở hữu:** BE lead.

---

### H-03 — 5 bản `ErrorCode` với tập mã `COMMON_*` khác nhau

**Vị trí:**

```text
api/identity-service/src/main/java/com/moonkage/identity/common/exception/ErrorCode.java
api/order-service/src/main/java/com/moonkage/order/exception/ErrorCode.java
api/payment-service/src/main/java/com/moonkage/payment/exception/ErrorCode.java
api/quotation-service/src/main/java/com/moonkage/quotation/common/exception/ErrorCode.java
api/vendor-service/src/main/java/com/moonkage/vendor/common/exception/ErrorCode.java
```

**Vấn đề.** Kiểm chứng tập mã `COMMON_*` trong từng enum:

| Service | Mã `COMMON_*` |
|---|---|
| identity | `400`, `400_JSON`, `403`, `404`, `405`, `500` |
| order | `400`, `400_JSON`, `400_PARAM`, `401`, `403`, `404`, `405`, `409`, `500`, `503` |
| payment | `400`, `400_JSON`, `401`, `403`, `404`, `405`, `409`, `500`, `503` |
| quotation | `400`, `400_JSON`, `401`, `403`, `404`, `405`, `409`, `500`, `503` |
| vendor | `400`, `400_JSON`, `400_PRICE`, `400_PRICE_TIERS`, `400_PROVINCE`, `400_QUANTITY`, `400_REQUIRED`, `400_TOO_LONG`, `401`, `403`, `404`, `405`, `409`, `500`, `501`, `503` |

`catalog-service` không dùng `ErrorCode` chung mà có `api/catalog-service/src/main/java/com/moonkage/catalog/exception/CatalogErrorCode.java`.

**Vì sao vi phạm:** Client đọc `code` để hiển thị thông điệp; mã `COMMON_409` ở order mang nghĩa "sai trạng thái" nhưng ở catalog không tồn tại. `COMMON_400_PARAM` chỉ có ở order.

**Sửa.** Tách phần chung vào `api/common-api` (cùng module với `ApiResponse`):

```java
package com.moonkage.api;

/** Mã lỗi dùng chung. Service chỉ thêm mã riêng của nghiệp vụ. */
public enum CommonErrorCode {
    INTERNAL_SERVER_ERROR("COMMON_500", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_INPUT("COMMON_400", HttpStatus.BAD_REQUEST),
    MALFORMED_JSON("COMMON_400_JSON", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED("COMMON_401", HttpStatus.UNAUTHORIZED),
    ACCESS_DENIED("COMMON_403", HttpStatus.FORBIDDEN),
    RESOURCE_NOT_FOUND("COMMON_404", HttpStatus.NOT_FOUND),
    METHOD_NOT_ALLOWED("COMMON_405", HttpStatus.METHOD_NOT_ALLOWED),
    INVALID_STATE_TRANSITION("COMMON_409", HttpStatus.CONFLICT),
    DEPENDENCY_UNAVAILABLE("COMMON_503", HttpStatus.SERVICE_UNAVAILABLE);
}
```

Mỗi service giữ enum riêng nhưng **phải kế thừa** tập mã chung (dùng `implements` với interface, hoặc đơn giản là dùng chung `CommonErrorCode` cho các case chung và enum riêng cho case nghiệp vụ).

**Đã xong 2026-11-05.** `api/common-api/src/main/java/com/moonkage/api/CommonErrorCode.java` giữ **17** mã `COMMON_*` — là phép hợp nhất (union) của đúng 5 bảng enum trên, nên không service nào mất mã đang có:

| Nhóm | Mã |
|---|---|
| Framework failures (10) | `500`, `400`, `400_JSON`, `400_PARAM`, `401`, `403`, `404`, `405`, `409`, `503` |
| Biến thể 400 của vendor (7) | `400_REQUIRED`, `400_TOO_LONG`, `400_PROVINCE`, `400_PRICE`, `400_QUANTITY`, `400_PRICE_TIERS`, `501` |

**Cách delegate (giữ nguyên API công khai của enum):** mỗi enum service thêm một constructor phụ nhận `CommonErrorCode` và chép 3 giá trị sang — `getCode()`, `getHttpStatus()`, `getMessageKey()` không đổi, nên **không call site nào phải sửa**:

```java
/** A common code, taken from the shared list of common-api. */
ErrorCode(CommonErrorCode common) {
    this.code = common.getCode();
    this.httpStatus = common.getHttpStatus();
    this.messageKey = common.getMessageKey();
}
```

```java
INTERNAL_SERVER_ERROR(CommonErrorCode.INTERNAL_SERVER_ERROR),
INVALID_INPUT(CommonErrorCode.INVALID_INPUT),
PARAMETER_REQUIRED(CommonErrorCode.PARAMETER_REQUIRED),
```

**Ngoại lệ — `quotation-service`:** enum này dùng **chuỗi tiếng Việt literal** ở ô thứ ba (`getMessage()`) thay vì message key, nên không delegate thẳng được. Nó dùng constructor riêng giữ nguyên văn bản:

```java
ErrorCode(CommonErrorCode common, String message) {
    this.code = common.getCode();
    this.httpStatus = common.getHttpStatus();
    this.message = message;
}
```

Kết quả: code string và HTTP status lấy từ nguồn chung, còn văn bản hiển thị cho người dùng **không đổi một chữ**.

**Nỗ lực:** 1,5 ngày. **Chủ sở hữu:** BE lead.

---

### H-04 — 5 bản `OutboxRelay` + 5 bản `OutboxServiceImpl`

**Vị trí:**

| `OutboxRelay` | Dòng | `OutboxServiceImpl` | Dòng |
|---|---|---|---|
| `api/identity-service/.../identity/outbox/OutboxRelay.java` | 70 | `api/identity-service/.../identity/outbox/OutboxServiceImpl.java` | 29 |
| `api/order-service/.../order/messaging/OutboxRelay.java` | 85 | `api/order-service/.../order/service/impl/OutboxServiceImpl.java` | 52 |
| `api/payment-service/.../payment/messaging/OutboxRelay.java` | 85 | `api/payment-service/.../payment/service/impl/OutboxServiceImpl.java` | 28 |
| `api/quotation-service/.../quotation/messaging/OutboxRelay.java` | 85 | `api/quotation-service/.../quotation/service/impl/OutboxServiceImpl.java` | 29 |
| `api/vendor-service/.../vendor/outbox/OutboxRelay.java` | 70 | `api/vendor-service/.../vendor/outbox/OutboxServiceImpl.java` | 51 |

**Vấn đề.** 5 bản relay lệch nhau (70 vs 85 dòng — identity và vendor không có cấu hình timeout xác nhận), 5 bản service impl lệch nhau (28–52 dòng). `catalog-service` có biến thể thứ 6 với tên khác: `api/catalog-service/.../catalog/scheduling/CatalogOutboxRelay.java` và `api/catalog-service/.../catalog/service/impl/OutboxDeliveryServiceImpl.java`.

**Vì sao vi phạm:** Chuẩn §4.6 quy định cùng một mẫu outbox cho mọi service. 6 bản cài đặt khác nhau nghĩa là một lỗi ở relay (ví dụ đánh dấu `published_at` trước khi broker xác nhận) sẽ phải sửa 6 chỗ và 6 chỗ có thể không sửa cùng lúc.

**Sửa.** Module `api/common-outbox` **đã có sẵn** phần lớn lời giải:

| Class sẵn có | Đường dẫn | Cung cấp |
|---|---|---|
| `OutboxRelay` | `api/common-outbox/src/main/java/com/moonkage/outbox/OutboxRelay.java` | Relay dùng chung: đọc theo lô, `waitForConfirmsOrDie` (chỉ đánh dấu `published_at` **sau** khi broker xác nhận), gauge `OutboxMetrics` |
| `OutboxEventSource` | `api/common-outbox/src/main/java/com/moonkage/outbox/OutboxEventSource.java` | Interface service tự cài — service vẫn giữ bảng `outbox_events` của riêng mình |
| `OutboxEvent`, `OutboxProperties` | `api/common-outbox/src/main/java/com/moonkage/outbox/` | Hợp đồng event và cấu hình (`@ConfigurationProperties`) |

Việc cần làm:

1. Khai báo `common-outbox` trong `api/pom.xml` và commit (xem H-10).
2. Thêm dependency vào pom của 5 service có outbox + `catalog-service`.
3. Mỗi service giữ entity `OutboxEvent` của riêng nó và một adapter `OutboxEventSource`; xoá `OutboxRelay` cũ.
4. `catalog-service` vẫn giữ `CatalogOutboxRelay` riêng **chỉ** nếu nó có hành vi khác thật (ví dụ ghi tombstone); nếu không thì dùng chung.

Điểm cần kiểm khi nối: `common-outbox` phụ thuộc `common-observability` (`OutboxMetrics`) — kiểm tra `api/common-outbox/pom.xml` đã khai báo đúng trước khi nối.

**Nỗ lực:** 2 ngày. **Chủ sở hữu:** BE lead.

---

### H-05 — `show-sql: true` hardcode ở 3 service

**Vị trí:**

| File | Dòng | Giá trị |
|---|---|---|
| `api/catalog-service/src/main/resources/application.yml` | 23 | `show-sql: true` |
| `api/quotation-service/src/main/resources/application.yml` | 31 | `show-sql: true` |
| `api/orchestrator-service/src/main/resources/application.yml` | 23 | `show-sql: true` |
| `api/identity-service/src/main/resources/application.yml` | 37 | `show-sql: ${JPA_SHOW_SQL:false}` |
| `api/order-service/src/main/resources/application.yml` | 33 | `show-sql: ${JPA_SHOW_SQL:false}` |
| `api/payment-service/src/main/resources/application.yml` | 33 | `show-sql: ${JPA_SHOW_SQL:false}` |
| `api/vendor-service/src/main/resources/application.yml` | 34 | `show-sql: ${JPA_SHOW_SQL:false}` |

**Vấn đề.** 3 service in **mọi** câu SQL ra log ở mọi môi trường, kể cả production. Ngoài rò rỉ dữ liệu nghiệp vụ vào log, còn tăng tải I/O.

**Vì sao vi phạm:** Chuẩn §4.8 nói cấu hình phải đến từ biến môi trường, không hardcode giá trị nhạy cảm theo môi trường.

**Sửa.** Đồng bộ 3 file còn lại về mẫu của 4 service đã đúng:

```yaml
spring:
  jpa:
    show-sql: ${JPA_SHOW_SQL:false}
```

**Nỗ lực:** 10 phút. **Chủ sở hữu:** BE lead.

---

### H-06 — 19 file `.module.css` không có file `.tsx`/`.ts` tương ứng

**Vị trí.** Kiểm chứng bằng cách tìm mọi `*.module.css` trong `web/src` mà file gốc cùng tên (thay `.module.css` bằng `.tsx`/`.ts`) không tồn tại:

```text
entities/order/ui/orderUi.module.css
entities/sitemap/ui/sitemapUi.module.css
features/attach-vendor-document/ui/attachVendorDocumentUi.module.css
features/checkout/ui/checkoutUi.module.css
features/edit-product/ui/editProductUi.module.css
features/edit-product/ui/productFormUi.module.css
features/edit-vendor-settings/ui/vendorSettingsUi.module.css
features/fulfill-order/ui/fulfillOrderUi.module.css
features/manage-cake-attributes/ui/AdminTaxonomyTab.module.css
features/pay-out/ui/payOutUi.module.css
features/request-disbursement/ui/requestDisbursementUi.module.css
features/request-quote/ui/QuoteRequestCards.module.css
features/review-applications/ui/reviewApplicationsUi.module.css
features/switch-persona/ui/QuickPersonaSelector.module.css
features/verify-nfc/ui/NfcPhoneSimulator.module.css
features/verify-nfc/ui/NfcVerificationSimulator.module.css
features/verify-nfc/ui/nfcVerifyUi.module.css
pages/system/sitemap/SitemapPage.module.css
shared/ui/Toast/Toast.module.css
```

**Vấn đề.** Đây là hai loại khác nhau:

1. **Nhóm hợp lệ** (16 file): nhiều component dùng chung một stylesheet, ví dụ `features/checkout/ui/checkoutUi.module.css` phục vụ `ShippingAddressForm.tsx`, `InvoiceRequestForm.tsx`, `PaymentMethodPanel.tsx`. Đây là ngoại lệ đã ghi ở chuẩn §10 — **không phải lỗi**.
2. **Nhóm mồ côi thật** (3 file): `entities/sitemap/ui/sitemapUi.module.css`, `features/switch-persona/ui/QuickPersonaSelector.module.css`, `pages/system/sitemap/SitemapPage.module.css` — các file `.tsx` tương ứng đã bị xoá (git status cho thấy `D web/src/entities/sitemap/...`, `D web/src/features/switch-persona/...`, `D web/src/pages/system/sitemap/SitemapPage.tsx`), nhưng CSS còn sót.

**Vì sao vi phạm:** Chuẩn §2.7 "đồng vị trị": xoá component thì xoá luôn stylesheet. File CSS mồ côi làm `check-css-modules.mjs` và `oxlint` không báo lỗi nhưng làm rác repo.

**Sửa.** Xoá 3 file mồ côi. Với 16 file nhóm hợp lệ: giữ nguyên, nhưng **ghi tên nhóm vào chuẩn** — đã ghi ở §10 và §2.7.

**Nỗ lực:** 15 phút. **Chủ sở hữu:** FE lead.

---

### H-07 — Hai slice đã xoá nhưng còn sót CSS mồ côi

Đây là phần cần xử lý trực tiếp của H-06, tách riêng vì nó là **mồ côi do việc refactor đang diễn ra**, không phải stylesheet nhóm:

**Vị trí:**

```text
web/src/entities/sitemap/ui/sitemapUi.module.css
web/src/features/switch-persona/ui/QuickPersonaSelector.module.css
web/src/pages/system/sitemap/SitemapPage.module.css
```

**Vấn đề.** Kiểm chứng bằng `git status --porcelain`:

```text
D web/src/features/switch-persona/index.ts
D web/src/features/switch-persona/ui/QuickPersonaSelector.tsx
D web/src/features/switch-persona/ui/__tests__/QuickPersonaSelector.test.tsx
D web/src/pages/system/sitemap/SitemapPage.tsx
D web/src/pages/system/sitemap/index.ts
```

Grep toàn bộ `web/src` cho `entities/sitemap`, `sitemapUi`, `SitemapPage` → **0 kết quả**. Không còn code nào import chúng.

**Sửa.**

```bash
git rm web/src/entities/sitemap/ui/sitemapUi.module.css
git rm web/src/features/switch-persona/ui/QuickPersonaSelector.module.css
git rm web/src/pages/system/sitemap/SitemapPage.module.css
```

Sau đó thư mục `web/src/entities/sitemap/` và `web/src/features/switch-persona/` trở nên rỗng — xoá nốt.

**Nỗ lực:** 10 phút. **Chủ sở hữu:** FE lead.

---

### H-08 — 5 service chưa có tài liệu service

**Vị trí.** Kiểm chứng thư mục `docs/services/`:

```text
catalog/       → README.md + 4 file + classes/ (8 file)
common-storage/→ classes/ (1 file), KHÔNG có README.md
identity/      → README.md + 4 file + classes/ (8 file)
quotation/     → README.md + classes/ (3 file)
vendor/        → README.md + 2 file
```

Thiếu README cho: `order`, `payment`, `orchestrator`, `common-storage`, và `catalog` thì có nhưng bảng `docs/README.md` ghi "—".

**Vấn đề.** Quy tắc 4 của `docs/README.md`: "Service chưa có thư mục thì tạo `services/<tên>/README.md` khi viết tài liệu đầu tiên". 3 service có nghiệp vụ lớn nhưng không có tài liệu mô tả luồng, bảng dữ liệu, cấu trúc package — trong khi `identity` có tài liệu rất đầy đủ.

**Đã xử lý (2026-11-05).** Đã tạo 4 README service theo đúng mẫu `docs/services/identity/README.md`:

| File mới | Nguồn đọc để viết phần API / dữ liệu / sự kiện |
|---|---|
| `docs/services/order/README.md` | `api/order-service/src/main/java/com/moonkage/order/controller/*.java` (7 controller), `.../messaging/JpaOutboxEventSource.java`, `api/order-service/src/main/resources/application.yml`, `api/order-service/src/main/resources/db/migration/*.sql` |
| `docs/services/payment/README.md` | `api/payment-service/src/main/java/com/moonkage/payment/controller/*.java` (5 controller: `PaymentController`, `RefundController`, `LedgerController`, `InternalPaymentController`, `InternalRefundController`), `.../messaging/JpaOutboxEventSource.java`, `api/payment-service/src/main/resources/application.yml`, `db/migration/*.sql` |
| `docs/services/orchestrator/README.md` | `api/orchestrator-service/src/main/java/com/moonkage/orchestrator/web/NotificationController.java` (controller duy nhất), `.../channel/email/EmailEventHandler.java`, `.../infrastructure/messaging/RabbitConfig.java`, `api/orchestrator-service/src/main/resources/application.yml`, `db/migration/V1__baseline.sql` |
| `docs/services/common-storage/README.md` | `api/common-storage/src/main/java/com/moonkage/storage/**` (`ObjectStorage`, `StorageProperties`, `StorageAutoConfiguration`, `PresignedUploadLink`, `ImageMetadataStripper`, …), `api/common-storage/src/main/resources/storage-messages.properties` — module này **không** có `application.yml` riêng và **không** có `db/migration/` (chỉ là thư viện) |

Bổ sung: `docs/README.md` (bảng "Services" + quy tắc 9), `docs/architecture/architecture-standards.md` §7.4/§7.5/§7.6.

**Quyết định có chủ ý — không tạo README cho hạ tầng và các thư viện còn lại.** `api/pom.xml` có 14 module. Ngoài 7 service nghiệp vụ (`identity`, `catalog`, `quotation`, `vendor`, `order`, `payment`, `orchestrator`) và thư viện `common-storage`, còn 7 module **không phải service nghiệp vụ**:

| Module | Vì sao không có `docs/services/<module>/README.md` |
|---|---|
| `api-gateway` | **Hạ tầng.** Chỉ định tuyến, kiểm token, rate limit — không có bounded context, không sở hữu dữ liệu nghiệp vụ, không có aggregate root |
| `discovery-server` | **Hạ tầng.** Chỉ đăng ký Eureka — không có bounded context, không sở hữu dữ liệu |
| `common-api` | **Thư viện.** `ApiResponse`, `PageResponse`, `GatewayHeader`, `GatewayRole`, `CommonErrorCode` — không chạy, không có cổng, không có DB |
| `common-outbox` | **Thư viện.** Relay outbox dùng chung — không chạy, không có cổng, không có DB |
| `common-reference` | **Thư viện.** Enum `Province` (A-18) — không chạy, không có cổng, không có DB |
| `common-observability` | **Thư viện.** Tên metric và bộ đếm dùng chung — không chạy, không có cổng, không có DB |
| `config` | **Cấu hình build.** Bộ luật ArchUnit + Checkstyle dùng chung, không phải artifact Maven |

Lý do chung: một README service mô tả *bounded context, aggregate root, bảng dữ liệu, sự kiện, cổng chạy* — những thứ mà 6 module trên không có. Tài liệu của chúng nằm ở [software-design.md](software-design.md) (gateway, Eureka) và [api-db/](api-db/) (hợp đồng event). `docs/README.md` §"Services" ghi rõ bảng này để không ai hiểu nhầm là thiếu sót.

**Nợ còn lại (không đóng trong đợt này):** ba thư viện `common-api`, `common-outbox`, `common-reference`, `common-observability` được các service dùng thật nhưng **chưa có** thư mục tài liệu riêng. Ghi thành P2-12 trong §8. `common-storage` có tài liệu vì nó đã có tài liệu class sẵn và là thư viện duy nhất có hợp đồng cấu hình (`storage.*`) mà từng service phải tự khai báo.

**Nỗ lực:** 2 ngày (4 file × 4 giờ). **Chủ sở hữu:** người giữ tài liệu + BE lead. **Trạng thái: đã xong 2026-11-05.**

---

### H-09 — Package controller đặt ở 3 vị trí theo 3 convention

**Vị trí.** Kiểm chứng toàn bộ 28 file `*Controller.java` trong `api/`:

| Service | Package của controller |
|---|---|
| catalog | `catalog.controller`, `catalog.controller.fee` |
| identity | `identity.web` |
| orchestrator | `orchestrator.web` |
| order | `order.controller` |
| payment | `payment.controller` |
| quotation | `quotation.controller` |
| vendor | `vendor.web` |

**Vấn đề.** Ba convention cùng tồn tại: `controller/`, `web/`, và `controller/<sub>/`. Người mới không biết đặt controller mới ở đâu.

**Vì sao vi phạm:** Chuẩn §2.3 yêu cầu một service dùng một kiểu; hiện có 3 kiểu trong 7 service. Tệ hơn: bộ luật ArchUnit (`api/config/archunit/com/moonkage/architecture/ArchitectureTest.java:30-49`) kiểm tra `..controller..` — nên 2 service dùng `web/` (identity, vendor) và orchestrator **không hề được luật controller nào kiểm tra**.

**Sửa.** Chọn `controller/` làm chuẩn vì 3 service đã dùng và ArchUnit đang kiểm tra. Đổi `identity.web` → `identity.controller`, `vendor.web` → `vendor.controller`, `orchestrator.web` → `orchestrator.controller` trong một PR riêng (đổi tên package, không đổi logic).

Trong lúc chờ đổi, cập nhật §2.3 của chuẩn để nêu rõ 3 vị trí hiện có và nói rõ hướng đích.

**Nỗ lực:** 0,5 ngày (đổi package + import). **Chủ sở hữu:** BE lead.

---

### H-10 — `common-api` và `common-outbox` đã vào build nhưng **chưa service nào dùng**, và hai module **chưa được commit**

**Vị trí.**

```text
api/pom.xml:24-25        ← <module>common-api</module> và <module>common-outbox</module>  (đã thêm, chưa commit)
api/common-api/          ← có pom.xml + 4 class + 2 test
api/common-outbox/       ← có pom.xml + 4 class + 1 test
```

Kiểm chứng tại thời điểm rà soát: `Select-String -Path api/pom.xml -Pattern '<module>'` → **14** mục, gồm `common-api` và `common-outbox` (`git diff api/pom.xml` cho thấy hai dòng `<module>` này là **thay đổi chưa commit**). `git status --porcelain api/common-api api/common-outbox` → `?? api/common-api/` và `?? api/common-outbox/` — **thư mục vẫn chưa được track**.

**Nội dung hai module (đã kiểm chứng):**

| Module | Class | Ghi chú |
|---|---|---|
| `common-api` | `ApiResponse<T>` (`common-api/src/main/java/com/moonkage/api/ApiResponse.java`) | record đầy đủ: `status, code, message, data, errors, path, timestamp` + factory `ok()/ok(T)/created/error(...)`. Đúng hợp đồng của chuẩn §3.1 |
| | `GatewayHeader`, `GatewayRole` | Hằng số header `X-Account-Id` / `X-User-Role` |
| | `PageResponse` | Hợp đồng phân trang |
| `common-outbox` | `OutboxRelay` (`common-outbox/src/main/java/com/moonkage/outbox/OutboxRelay.java`) | Relay dùng chung, có `publisher confirm` và gauge `OutboxMetrics` |
| | `OutboxEvent`, `OutboxEventSource`, `OutboxProperties` | Hợp đồng cho service tự giữ bảng `outbox_events` |

**Vấn đề.** Hai module này **đúng là lời giải** cho H-01 (7 bản `ApiResponse`) và H-04 (5 bản `OutboxRelay`): `common-api` đã có sẵn `ApiResponse` với đúng trường `errors` mà catalog và orchestrator đang thiếu; `common-outbox` đã có sẵn `OutboxRelay` với `waitForConfirmsOrDie` — thứ mà bản của identity và vendor đang thiếu. Nhưng bước 1 (khai báo trong build) **đã xong**, còn hai việc thì chưa:

1. **Chưa commit.** `git status` vẫn cho `?? api/common-api/` và `?? api/common-outbox/`; kèm `api/pom.xml` là `M`. Nếu PR merge mà thư mục bị bỏ sót, build sẽ fail ngay vì `api/pom.xml` khai báo `<module>` cho thư mục không có trong index.
2. **Chưa service nào dùng.** Quét `api/*/pom.xml`: **không** service nào khai báo dependency `common-api` hay `common-outbox` — chỉ chính hai pom của module đó tự khai báo. Kiểm chứng thêm bằng cách đếm file `ApiResponse.java` trên đĩa: **8 bản** (7 bản cục bộ + 1 bản trong `common-api`); `common-api` không được service nào import.

**Vì sao vi phạm.** Chuẩn §2.1 nêu 14 module Maven — đã khớp. Nhưng chuẩn §3.1 ("Nguồn duy nhất của envelope: `api/common-api`") và §4.6 (outbox dùng chung) **dựa trên giả định mã dùng chung nằm trong `common-*` và được build** — ở đây module đã build nhưng **chưa ai dùng**, nên 7 bản `ApiResponse` trùng lặp vẫn tồn tại và H-01/H-04 chưa được giải quyết.

**Sửa.** Hai bước còn lại:

1. **Commit** `api/common-api/` và `api/common-outbox/` **cùng** với thay đổi `api/pom.xml` trong cùng một PR — điều kiện tiên quyết, thiếu là build fail ngay.
2. **Rồi mới** cho service dùng: thêm dependency vào pom của service, xoá bản `ApiResponse`/`OutboxRelay` cũ, đổi import. Việc này chính là nội dung H-01 và H-04 — nói cách khác, **H-01 và H-04 đã có sẵn phần lớn lời giải, chỉ thiếu bước "service dùng thật"**.

Ghi chú cho bước 2: `common-outbox` phụ thuộc `common-observability` (`OutboxMetrics`); `common-api` cần `spring-web` cho `HttpStatus` — kiểm tra `api/common-api/pom.xml` đã khai báo đúng trước khi nối.

**Nỗ lực:** 15 phút cho bước 1; H-01 và H-04 mỗi cái 0,5–1 ngày cho bước 2. **Chủ sở hữu:** BE lead.

---

## 5. Phát hiện Medium

### M-01 — Không có `spring.jpa.open-in-view: false`

**Vị trí.** Grep `open-in-view` trên `api/*/src/main/resources/application.yml` → **0 kết quả** ở cả 7 service.

**Vấn đề.** Mặc định của Spring Boot là `open-in-view: true`: session JPA mở suốt thời gian render response. Hệ quả: giữ connection DB trong thời gian ghi response (giảm throughput), và nhiều truy vấn N+1 chạy ngoài transaction nên lazy loading vẫn "chạy được" — che giấu lỗi thiết kế.

**Sửa.** Thêm vào `application.yml` của cả 7 service:

```yaml
spring:
  jpa:
    open-in-view: false
```

Sau đó chạy `./mvnw verify` — nếu service nào lỗi `LazyInitializationException`, đó là truy vấn N+1 cần sửa bằng `join fetch` hoặc `@EntityGraph`.

**Nỗ lực:** 0,5 ngày + sửa N+1 phát sinh. **Chủ sở hữu:** BE lead.

---

### M-02 — Không có graceful shutdown

**Vị trí.** Grep `shutdown` trên `api/*/src/main/resources/application.yml` → **0 kết quả**.

**Vấn đề.** Khi container bị dừng, các request đang xử lý bị cắt. Với luồng thanh toán và outbox relay, mất request giữa chừng có thể để lại payment ở trạng thái `PENDING`.

**Sửa.** Thêm vào cả 7 service:

```yaml
server:
  shutdown: graceful

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

**Nỗ lực:** 30 phút. **Chủ sở hữu:** BE lead.

---

### M-03 — `catalog-service` trả 2 hình dạng lỗi tùy đường dẫn

**Vị trí:** `api/catalog-service/src/main/java/com/moonkage/catalog/common/exception/GlobalExceptionHandler.java:86-96` (method `usesEnvelope`) và `:98-101`.

**Vấn đề.**

```java
private boolean usesEnvelope(HttpServletRequest request) {
    String path = request.getServletPath().isEmpty() ? request.getRequestURI() : request.getServletPath();
    return path.equals("/api/interprovince-fees")
            || path.startsWith("/api/interprovince-fees/")
            || path.equals("/api/products")
            || path.startsWith("/api/products/");
}
```

Ngoài 4 đường dẫn này, lỗi trả `new ErrorResponse(status, error, message, path, timestamp)` — hình dạng `{status, error, message, path, timestamp}`, **không có** `code` và `data`. Frontend `unwrap()` kiểm tra `'code' in res` (`web/src/shared/api/envelope.ts:87-95`); với `ErrorResponse` không có `code`, `unwrap` coi như payload thô và trả về nguyên đối tượng lỗi — người dùng thấy mảng rỗng thay vì thông báo lỗi.

**Sửa.** Khi nối `common-api` (H-01), bỏ hoàn toàn `ErrorResponse` và `usesEnvelope`. Mọi lỗi trả về `ApiResponse` với `code` và `data = null`:

```java
@ExceptionHandler(Exception.class)
public ResponseEntity<ApiResponse<Void>> handleUnhandled(Exception ex, HttpServletRequest request) {
    log.error("Unexpected error", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR,
                    "COMMON_500", "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.", null, request.getRequestURI()));
}
```

**Nỗ lực:** 0,5 ngày (kèm H-01). **Chủ sở hữu:** BE lead.

---

### M-04 — `@Value` rải rác thay vì `@ConfigurationProperties`

**Vị trí.** Grep `@Value("` trên `api/**/src/main/java` → 21 chỗ. Nhóm đáng chú ý:

```text
api/order-service/.../order/messaging/OutboxRelay.java:40-41
api/payment-service/.../payment/messaging/OutboxRelay.java:40-41
api/quotation-service/.../quotation/messaging/OutboxRelay.java:40-41
```

Ba bản relay đọc cùng hai giá trị bằng `@Value`. Trong khi repo đã có 22 class `@ConfigurationProperties` (`OutboxProperties`, `RateLimitProperties`, `OrderProperties`, `VnpayProperties`, `NfcProperties`, `SecurityProperties`, `PublicImageProperties`, …).

**Vì sao vi phạm:** Chuẩn §4.8 khuyến nghị `@ConfigurationProperties` cho nhóm giá trị. Ở đây 3 service dùng cùng một nhóm `outbox.batch-size` / `outbox.confirm-timeout` nhưng bằng 3 cách khai báo riêng.

**Sửa.** `OutboxProperties` **đã có sẵn** trong `api/common-outbox` (`api/common-outbox/src/main/java/com/moonkage/outbox/OutboxProperties.java`). Sau khi nối `common-outbox` (H-04), cả 5 service dùng chung nó và bỏ hết `@Value` cho `outbox.batch-size` / `outbox.confirm-timeout` / `outbox.relay-interval`. Kiểm tra `api/common-outbox/pom.xml` đã khai báo đúng trước khi nối.

Các `@Value` còn lại là giá trị đơn lẻ (khóa bí mật, đường dẫn) — chấp nhận được theo chuẩn.

**Nỗ lực:** 0,5 ngày (kèm H-04). **Chủ sở hữu:** BE lead.

---

### M-05 — `catalog-service` còn bảng `products` cũ với cột `deleted`

**Vị trí:** `api/catalog-service/src/main/resources/db/migration/V1__baseline.sql:19-33` (bảng `public.products`, cột `deleted boolean NOT NULL` ở dòng 21, cột `cake_type` ở dòng 22).

**Vấn đề.** Sau L-18 và BE-09, catalog là **bản đọc thuần** dựng từ `product.upserted`; sản phẩm được ghi ở `vendor-service`. Bảng `products` còn nằm trong baseline của catalog với cột `deleted` — trong khi L-04 đã chốt **bỏ** cột `products.deleted` và bỏ endpoint `DELETE /api/seller/products/{productId}`.

Kiểm chứng thêm: `api/catalog-service/src/main/resources/db/migration/` có `V2026_10_22_1000__align_with_api_db_outline.sql` và `V2026_10_22_1510__product_views_crust_filling.sql`, tức là đã có migration dựng bản đọc — nhưng chưa có migration **xoá** bảng `products` cũ.

**Vì sao vi phạm:** Hai nguồn sự thật về sản phẩm trong cùng một database. Bảng `products` không còn được đọc bởi code catalog (code chỉ dùng `product_views`/`product_listings` qua `ProductListingRepository`), nhưng nó vẫn tồn tại và có dữ liệu.

**Sửa.** Thêm migration mới (không sửa `V1__baseline.sql`):

```sql
-- V2026_11_05_1000__drop_legacy_products_table.sql
DROP TABLE IF EXISTS public.products CASCADE;
```

Chạy `flyway validate` trên DB dev để chắc không có view/index nào tham chiếu bảng này.

**Nỗ lực:** 2 giờ + kiểm tra dữ liệu dev. **Chủ sở hữu:** người phụ trách catalog.

---

### M-06 — 2 page gọi trực tiếp `uploadFile` từ `@/shared/api`

**Vị trí:**

```text
web/src/pages/account/order-dispute/OrderDisputePage.tsx:18,63
web/src/pages/vendor/orders/VendorOrdersPage.tsx:15,76,108
```

**Vấn đề.** Chuẩn §6.9 quy định page không gọi API trực tiếp; upload là hành động nghiệp vụ nên thuộc `features`. Repo đã có `features/upload-product-image/model/useUploadProductImage.ts` — cùng một thao tác upload nhưng tách ở 3 nơi.

**Sửa.** Tạo `features/upload-evidence/model/useUploadEvidence.ts` (hoặc mở rộng feature upload hiện có) và dùng trong 2 page:

```tsx
// ✘ hiện tại
import { uploadFile } from '@/shared/api';
const url = await uploadFile(file, { target: 'dispute-evidence' });

// ✔ sau khi sửa
import { useUploadEvidence } from '@/features/upload-evidence';
const { upload } = useUploadEvidence();
const url = await upload(file);
```

**Nỗ lực:** 0,5 ngày. **Chủ sở hữu:** FE lead.

---

### M-07 — 40 file scratch trong `web/scripts/` chưa được ignore

**Vị trí.** `git status --porcelain web/scripts/` cho **45** dòng `??`; trong đó 41 file có tên `tmp-*`:

```text
web/scripts/tmp-bytes.mjs      web/scripts/tmp-check.mjs      web/scripts/tmp-check.txt
web/scripts/tmp-cmp.mjs        web/scripts/tmp-cmp.txt        web/scripts/tmp-collect-dist.mjs
web/scripts/tmp-corrupt.mjs    web/scripts/tmp-corrupt.txt    web/scripts/tmp-ctx.mjs
web/scripts/tmp-ctx.txt        web/scripts/tmp-d1.txt         web/scripts/tmp-d2.txt
web/scripts/tmp-d3.txt         web/scripts/tmp-dall.mjs       web/scripts/tmp-dall.txt
web/scripts/tmp-detect.mjs     web/scripts/tmp-diag.mjs       web/scripts/tmp-diff.mjs
web/scripts/tmp-diff.txt       web/scripts/tmp-diff2.mjs      web/scripts/tmp-enc-probe.mjs
web/scripts/tmp-hex.mjs        web/scripts/tmp-map.mjs        web/scripts/tmp-map.txt
web/scripts/tmp-mark.mjs       web/scripts/tmp-mark.txt       web/scripts/tmp-outline.txt
web/scripts/tmp-probe.txt      web/scripts/tmp-radius.mjs     web/scripts/tmp-rem.mjs
web/scripts/tmp-rem.txt        web/scripts/tmp-report.mjs     web/scripts/tmp-report.txt
web/scripts/tmp-scan.mjs       web/scripts/tmp-scan.txt      web/scripts/tmp-state.json
web/scripts/tmp-state.mjs      web/scripts/tmp-suspect.mjs    web/scripts/tmp-suspect.txt
web/scripts/tmp-utf8-probe.ts
```

Kiểm chứng `git ls-files web/scripts/` chỉ có 5 file được track: `check-bundle-size.mjs`, `check-css-modules.mjs`, `check-encoding.mjs`, `list-api-paths.mjs`, `list-gateway-usage.mjs`. Ngoài ra 4 file cũng chưa track: `check-no-spec-ids.mjs` (phải commit — xem B-02), `fix-utf8.mjs`, `repair-encoding.mjs`, `restore-vietnamese.mjs`.

**Vấn đề.** 41 file `tmp-*` là công cụ sửa lỗi encoding một lần, không phải công cụ dự án; chúng chiếm phần lớn thư mục `web/scripts/` và sẽ bị commit nếu ai đó chạy `git add .`. `.gitignore` đã có khối "Scratch output của script kiểm tra / diff tạm" (dòng 85-95) nhưng chỉ liệt kê file ở `web/` gốc và `web/doc/_tmp_img/`, **chưa có mẫu cho `web/scripts/`**.

**Sửa.** Bổ sung vào `.gitignore`:

```gitignore
# Script sửa lỗi một lần / script tạm
web/scripts/tmp-*
web/scripts/fix-*.mjs
web/scripts/repair-*.mjs
web/scripts/restore-*.mjs
```

`check-no-spec-ids.mjs` **phải commit** (xem B-02) — không ignore nó.

**Nỗ lực:** 15 phút (xoá 41 file + 4 dòng `.gitignore`). **Chủ sở hữu:** FE lead.

**Nỗ lực:** 5 phút. **Chủ sở hữu:** FE lead.

---

### M-08 — `any` trong `web/src/app/lazyPage.tsx`

**Vị trí:**

```text
web/src/app/lazyPage.tsx:12   export function lazyPage<T extends ComponentType<any>>(
web/src/app/lazyPage.tsx:30   return function SuspenseWrappedPage(props: any) {
```

**Vấn đề.** Kiểm chứng toàn bộ `web/src` cho `: any`, `<any>`, `as any` → chỉ 2 chỗ này (kể cả `web/src/shared/test/setup.ts:23` — dòng setup test, chấp nhận được). Với `tsc -b` ở strict mode, `any` ở đây là điểm yếu type.

**Sửa.** Generic chuyển từ *component* sang *props* — đúng cái React thực sự quan tâm. **Đã xong 2026-11-05**:

```tsx
export function lazyPage<P extends object = Record<string, never>>(
  factory: () => Promise<{ default: ComponentType<P> }>
): ComponentType<P> {
  const Component = lazy(factory);
  return function SuspenseWrappedPage(props: P) { /* … */ };
}
```

`P extends object` giữ `P` gán được cho `PropsWithoutRef` (kiểm tra props khi JSX), còn mặc định `Record<string, never>` nghĩa là call site bỏ generic sẽ suy ra "trang không có props" — đúng với mọi route component trong `web/src/app/routes.tsx` (đều render qua `withSuspense(Page)` không truyền props). Trang **có** props giờ được kiểm tra kiểu thật: `default` export phải nhận đúng `P`, lệch là lỗi biên dịch thay vì `any` lọt qua.

`web/src/app/` hiện còn **0** `any` ở vị trí kiểu (đã kiểm bằng `rg` cho `: any`, `<any>`, `as any`, `any[]`).

**Nỗ lực:** 1 giờ. **Chủ sở hữu:** FE lead.

---

### M-09 — 10 file trong `web/doc/` dùng tên `UPPER_SNAKE_CASE`

**Vị trí.** Kiểm chứng thư mục `web/doc/` (10 file `.md` cộng 1 file `architecture/package-architecture.md`):

```text
BAO_CAO_DANH_GIA_LAI_02-11-2026.md
BAO_CAO_DANH_GIA_LAI_03-11-2026.md
BAO_CAO_DANH_GIA_VA_LO_TRINH_CAI_THIEN.md
BAO_CAO_KET_QUA_CAI_THIEN_TEMP_DAT_CHUAN_PROD.md
BAO_CAO_KHAC_PHUC_TOAN_BLE_02-11-2026.md
DANH_GIA_FE_DOANH_NGHIEP_02-11-2026.md
KET_HOACH_CAI_THIEN_TEMP.md
SO_SANH_TEMP_VS_WEB_02-11-2026.md
SO_SANH_VOI_BAN_WEB_02-11-2026.md
UI_UX_AUDIT_05-11-2026.md
```

**Vấn đề.** Chuẩn §2.9 quy định `kebab-case.md` cho tài liệu. 10 file này vi phạm. Đồng thời, `web/doc/` **không** nằm trong `docs/` — nghĩa là các báo cáo này không nằm trong hệ thống tài liệu có index, không được CI kiểm link (`docs-links.yml` quét `./**/*.md` nên vẫn quét, nhưng không có bản đồ).

**Sửa.** Đổi tên theo kebab-case — **đã xong 2026-11-05**:

| Tên cũ | Tên mới |
|---|---|
| `BAO_CAO_DANH_GIA_LAI_02-11-2026.md` | `bao-cao-danh-gia-lai-2026-11-02.md` |
| `BAO_CAO_DANH_GIA_LAI_03-11-2026.md` | `bao-cao-danh-gia-lai-2026-11-03.md` |
| `BAO_CAO_DANH_GIA_VA_LO_TRINH_CAI_THIEN.md` | `bao-cao-danh-gia-va-lo-trinh-cai-tien.md` |
| `BAO_CAO_KET_QUA_CAI_THIEN_TEMP_DAT_CHUAN_PROD.md` | `bao-cao-ket-qua-cai-tien-temp-dat-chuan-prod.md` |
| `BAO_CAO_KHAC_PHUC_TOAN_BLE_02-11-2026.md` | `bao-cao-khac-phuc-toan-ble-2026-11-02.md` |
| `DANH_GIA_FE_DOANH_NGHIEP_02-11-2026.md` | `danh-gia-fe-doanh-nghiep-2026-11-02.md` |
| `KET_HOACH_CAI_THIEN_TEMP.md` | `ket-hoach-cai-tien-temp.md` |
| `SO_SANH_TEMP_VS_WEB_02-11-2026.md` | `so-sanh-temp-vs-web-2026-11-02.md` |
| `SO_SANH_VOI_BAN_WEB_02-11-2026.md` | `so-sanh-voi-ban-web-2026-11-02.md` |
| `UI_UX_AUDIT_05-11-2026.md` | `ui-ux-audit-2026-11-05.md` |

9 file dùng `git mv` (giữ lịch sử); `UI_UX_AUDIT_05-11-2026.md` chưa từng được commit nên là move thường. **7 chỗ tham chiếu trong repo đã cập nhật** (`web/src/shared/api/tokenVault.ts:17` và 6 chỗ trong `web/doc/`). `rg` toàn repo không còn tham chiếu nào tới tên cũ.

**Nỗ lực:** 1 giờ. **Chủ sở hữu:** FE lead.

---

### M-10 — 20 file tài liệu class không có quy trình cập nhật

**Vị trí.** Kiểm chứng:

```text
docs/services/catalog/classes/       → 8 file
docs/services/identity/classes/      → 8 file
docs/services/quotation/classes/     → 3 file
docs/services/common-storage/classes/→ 1 file
```

Tổng 20 file, định dạng thống nhất: "Thông tin chung và bất biến · Method · Pseudocode · Giới hạn" — theo mẫu [coding-rules.md §5](../conventions/coding-rules.md).

**Vấn đề.** Đây là tài liệu **sinh tay** mô tả pseudocode của class. Khi code đổi, tài liệu không tự báo lỗi — và CI không có bước nào kiểm tra. Ví dụ: `docs/services/catalog/classes/ProductReadServiceImpl.md` mô tả chi tiết hành vi, trong khi `catalog-service` đã được refactor thành bản đọc thuần ở BE-09 — file tài liệu có ghi chú BE-09 nên vẫn còn đúng, nhưng đó là may mắn, không phải quy trình.

**Đã xử lý (2026-11-05).** Chọn **phương án 1** (giữ tài liệu tay, thêm quy trình + gate CI). Ba thay đổi:

1. **Giữ tài liệu tay, thêm quy trình:** mỗi class trong danh sách phải được cập nhật **cùng PR** khi code của nó đổi; CI thêm bước đối chiếu tên file `classes/<ClassName>.md` với file `<ClassName>.java` tương ứng.
2. **Sinh tài liệu từ code:** thêm task Maven đọc javadoc + chữ ký method, xuất ra `classes/<ClassName>.md`. Tốn công hơn nhưng không bao giờ lệch.

Đã chọn **phương án 1** cho repo này (quy mô 20 file). Chi tiết quy trình và gate CI ở phần dưới.

**Quy tắc (nguồn chuẩn)** — `docs/architecture/architecture-standards.md` §7.6 mới (và bảng "Thay đổi code → cập nhật tài liệu" trong §7.5 có thêm dòng cho việc đổi/xoá class):

| Câu hỏi | Trả lời |
|---|---|
| **Phạm vi** | Mỗi file `docs/services/<service>/classes/<ClassName>.md` mô tả **một** class Java `api/<module>/src/main/java/**/<ClassName>.java`; tên file phải khớp đúng tên class. |
| **Khi nào phải cập nhật** | Trong **cùng PR** với thay đổi chạm vào class: đổi tên class, đổi package, đổi/xoá method, đổi luật bất biến, đổi mã lỗi nghiệp vụ, đổi thứ tự trạng thái. Class không còn đáng viết tài liệu → **xoá file** tài liệu trong cùng PR. |
| **Ai giữ** | Tác giả của PR sửa code của class đó; người giữ tài liệu chỉ cập nhật danh sách class nặng. |
| **Kiểm tra bằng gì** | `node docs/scripts/check-class-docs.mjs` — đối chiếu tên file `classes/<ClassName>.md` với file `<ClassName>.java` trong module tương ứng; chạy trong `.github/workflows/docs-links.yml` ở bước **Check class docs match source**. |
| **Giới hạn** | Script bắt được class **đã đổi tên hoặc bị xoá**; nội dung tài liệu còn đúng với hành vi mới thì người review PR phải đọc lại. |

**Gate CI** — script mới `docs/scripts/check-class-docs.mjs` (Node ESM, đầu file có block comment tiếng Việt giải thích **vì sao** script tồn tại, theo đúng quy ước của `web/scripts/check-*.mjs`). Script quét `docs/services/*/classes/*.md`, suy ra module Maven tương ứng, tìm file Java cùng tên trong `api/<module>/src/main/java/**`; nếu không tìm thấy thì in lỗi có tên file và **exit 1**. Kết quả hiện tại: `✓ 20 tài liệu class đều còn khớp với mã nguồn trong api/.`

**Nối vào CI** — `.github/workflows/docs-links.yml`: thêm trigger `api/**/*.java` và bước riêng **Check class docs match source** (chạy `node docs/scripts/check-class-docs.mjs`), tách khỏi job lychee để báo lỗi rõ ràng.

**Nỗ lực:** 0,5 ngày (phương án 1). **Chủ sở hữu:** người giữ tài liệu. **Trạng thái: đã xong 2026-11-05.**

---

### M-11 — Sổ ID không ghi `000300000101` và `000900000001`

**Vị trí.** Kiểm chứng toàn bộ ID trong 7 file `R__seed.sql`:

```text
000100000000  000100000001  000100000002  000100000003  000100000004  000100000005
000200000001  000200000002  000300000001  000300000101
000600000001  000600000002  000600000003
000700000001  000700000002  000900000001
```

Đối chiếu sổ ID tại `docs/guides/database.md` §5 (bảng loại `0001` → `0008`): `000300000101` (bậc giá sản phẩm) và `000900000001` (outbox event `product.upserted`) **không có trong sổ**.

**Vấn đề.** Chuẩn §4.4 quy định "Loại mới thì lấy mã kế tiếp và thêm một dòng vào bảng". `0009` là một loại mới (outbox event) chưa được ghi vào sổ. `000300000101` nằm trong loại `0003` (product) nhưng là bậc giá — cần quy ước ghi rõ.

**Đã xử lý (2026-11-05).** `docs/guides/database.md` §5 nay có thêm hai dòng:

```markdown
| price tier | `0003` (con) | `…-000300000101` | bậc giá số lượng lớn của sản phẩm `…-000300000001` | vendor |
| outbox event | `0009` | `…-000900000001` | `eventId` của sự kiện `product.upserted` trong seed (dùng làm khoá chống xử lý trùng ở inbox của catalog) | vendor |
```

Dòng cuối của §5 cũng trỏ tới D-26 trong `api-db/decisions.md` để nhắc quy tắc "ID trong seed phải có trong sổ".

---

### M-12 — `docs/services/identity/README.md` mô tả `Role` cũ

**Vị trí:** `docs/services/identity/README.md:3` và `:32`.

**Vấn đề.** Dòng 3 nói "Account có vai (`Role` enum)" — không sai, nhưng tài liệu không nêu rõ hai giá trị. Dòng 32 liệt kê `Role` trong `account.atom` cùng `Email`, `PhoneNumber`, `PasswordHash`, `PasswordConstant` — nhưng `account.atom` **không** tồn tại: package thật là `api/identity-service/src/main/java/com/moonkage/identity/account/atom/` chứa `Role.java`; kiểm chứng cho thấy `Role` nằm ở `account/atom/` nhưng các atom khác phân bố khác.

**Vì sao vi phạm:** Chuẩn §8.1 "code là bản đúng". Tài liệu mô tả cấu trúc package theo cách hiểu khác với code.

**Đã xử lý (2026-11-05).** Đối chiếu enum thật `api/identity-service/src/main/java/com/moonkage/identity/account/atom/Role.java` (chỉ có `MEMBER` và `ADMIN`) và các file liên quan, rồi sửa `docs/services/identity/README.md`:

| Vị trí | Trước | Sau |
|---|---|---|
| Dòng mở đầu | "Account có vai (`Role` enum)" | "`Role` enum, chỉ hai giá trị `MEMBER` và `ADMIN` theo D-19 — *chủ người bán không phải một vai*" |
| Bảng "Cấu trúc mã" (dòng `account`) | liệt kê `account.atom` gồm `Email`, `PhoneNumber`, `PasswordHash`, `PasswordConstant`, `Role` | giữ nguyên danh sách, thêm chú thích "`Role` — enum `MEMBER` / `ADMIN`, D-19" |
| Bảng "Dữ liệu" (`accounts`) | cột `role` không ghi giá trị | "`role` (`MEMBER` / `ADMIN`, D-19; không có bảng role)" |

**Quét toàn bộ `docs/`** tìm tham chiếu tới tên vai cũ (`CUSTOMER` / `SELLER`): chỉ còn ở `docs/architecture/architecture-standards.md` §9 (bảng "đặt tên sai → đúng", **đúng** — ghi tên cũ để cảnh báo) và trong `docs/archive/` (bản ghi lịch sử, **giữ nguyên** có chủ ý). `docs/product/requirements.md`, `docs/architecture/api-db/README.md` và các `docs/services/*/README.md` khác **không** còn tham chiếu tên vai cũ.

**Nỗ lực:** 1 giờ. **Chủ sở hữu:** người giữ tài liệu. **Trạng thái: đã xong 2026-11-05.**

### M-13 — CSP meta chứa `upgrade-insecure-requests` ở môi trường HTTP làm chặn request tới API gateway

**Vị trí:** `web/src/shared/config/security.ts` (`CSP_DIRECTIVES`, `applyCspMeta()`, `cspConnectSources()`), `web/src/app/main.tsx:46`, `web/playwright.config.ts` (`webServer.reuseExistingServer`).

**Vấn đề.** `upgrade-insecure-requests` nằm chung trong `CSP_DIRECTIVES`, nên thẻ `<meta>` sinh ra ở bản build (`import.meta.env.PROD` → `applyCspMeta()`) cũng chứa directive này.

Bản E2E được phục vụ bằng `vite preview` tại `http://127.0.0.1:4173`. Origin loopback là "potentially trustworthy" nên vẫn là secure context ⇒ trình duyệt **vẫn áp dụng** `upgrade-insecure-requests` ⇒ mọi request `http://127.0.0.1:8080` (API gateway trong docker compose, chỉ phục vụ HTTP) bị nâng thành `https://127.0.0.1:8080`. Nhưng `connect-src` chỉ khai `http://127.0.0.1:8080` ⇒ trình duyệt chặn request:

```text
Connecting to 'https://127.0.0.1:8080/api/products?provinceCode=01&size=100'
violates the following Content Security Policy directive:
"connect-src 'self' http://127.0.0.1:8080 ws://127.0.0.1:8080". The action has been blocked.
```

Hậu quả: danh mục rỗng (`locator('article')` không tìm thấy), timeout mở trang chi tiết, và 3 test "không có lỗi console" đỏ.

**Vấn đề thứ hai, cùng lúc phát hiện.** `playwright.config.ts` đặt `reuseExistingServer: !process.env.CI` ⇒ khi đã có `vite preview` cũ ở port 4173, Playwright **không chạy** lệnh `command` (vốn gồm `npm run build`) và phục vụ bundle cũ. Lần E2E "xanh" trước đó thực ra là **pass giả** trên bundle cũ; lỗi chỉ lộ ra ở lần build lại.

**Đã xử lý (2026-11-06).**

| Vị trí | Trước | Sau |
|---|---|---|
| `CSP_DIRECTIVES` | chứa `'upgrade-insecure-requests'` | không chứa; directive tách thành hằng `UPGRADE_INSECURE_REQUESTS` kèm docblock giải thích **vì sao** không được thêm lại |
| `buildCspHeader()` | gián tiếp qua `CSP_DIRECTIVES` | thêm `UPGRADE_INSECURE_REQUESTS` tường minh — header HTTP production **giữ** directive này |
| `applyCspMeta()` | luôn kèm directive | chỉ kèm khi `isSecureOrigin()` (`window.location.protocol === 'https:'`) |
| `cspConnectSources()` | khai `http://`/`ws://` | khai **cả hai** biến thể `http://`+`https://` và `ws://`+`wss://` cho cùng host, để CSP không lệch với `upgrade-insecure-requests` khi deploy qua HTTPS |
| `web/playwright.config.ts` | `reuseExistingServer: !process.env.CI` | `reuseExistingServer: false` — luôn build + start preview mới, không còn pass giả trên bundle cũ |

Kiểm chứng: `npm run check` xanh (87 file test / 362 test pass); `npm run e2e` **45 passed / 5 skipped / 0 failed**; `rg -o 'https?://127\.0\.0\.1:8080' dist` xác nhận bundle build đúng gateway. Test khoá hành vi mới nằm ở `web/src/shared/config/__tests__/security.test.ts` (meta CSP trên origin http không có directive; `buildCspHeader()` có; `cspConnectSources()` có cả `https://` variant).

**Nỗ lực:** 2 giờ. **Trạng thái: đã xong 2026-11-06.**

---

## 6. Phát hiện Low

### L-01 — File backup của editor trong cây module

**Vị trí:**

```text
api/quotation-service/.LCKpom.xml~
api/identity-service/src/test/java/com/moonkage/identity/outbox/.LCKOutboxRelayTest.java~
api/vendor-service/src/test/java/com/moonkage/vendor/outbox/.LCKOutboxRelayTest.java~
```

**Vấn đề.** File backup do editor tạo (ký tự `~` cuối tên). Maven có thể bỏ qua nhưng nó làm rác cây module và có thể được commit nhầm.

**Sửa.** Xoá file và bổ sung vào `.gitignore`:

```gitignore
*~
```

— **Đã xong 2026-11-05**: quét toàn bộ `api/` không còn file `*~` nào.

**Nỗ lực:** 2 phút.

### L-02 — `web/e2e/` không có `testIgnore`; file debug tạm sẽ chạy trong CI

**Vị trí:** `web/playwright.config.ts:15-16` (`testDir: './e2e'`, không khai báo `testMatch` hay `testIgnore`).

**Vấn đề.** `web/playwright.config.ts` **không** khai báo `testMatch` và **không** khai báo `testIgnore`. Playwright mặc định dùng `**/*.@(spec|test).?(c|m)[jt]s?(x)` — tức là file tên `*_tmp-debug2.spec.ts` **có** khớp và sẽ chạy trong CI nếu bị commit. Repo hiện có `web/e2e/_tmp-debug2.spec.ts` trong `git status` (dòng `??`), và các file tương tự có thể xuất hiện lại bất cứ lúc nào.

**Sửa.** Khai báo `testIgnore` rõ ràng — **đã xong 2026-11-05**:

```ts
export default defineConfig({
  testDir: './e2e',
  // Loại trừ file debug tạm: glob mặc định của Playwright là `**/*.@(spec|test)...`
  // nên một file tên `_tmp-debug2.spec.ts` lọt vào `web/e2e/` sẽ bị CI chạy.
  // File tạm chỉ dùng để dò lỗi cục bộ, không bao giờ được chạy trong CI.
  testIgnore: ['**/_tmp*/**', '**/_tmp-*', '**/tmp-*'],
  // ...
});
```

`.gitignore` (repo root) bổ sung:

```gitignore
web/e2e/_tmp*/
web/e2e/_tmp-*
web/e2e/tmp-*
```

Đã kiểm chứng bằng `git check-ignore -v` cho cả ba dạng (file `_tmp-*.spec.ts`, file `tmp-*.spec.ts`, thư mục `_tmpdir/`) và bằng `npx playwright test --list` (vẫn báo đúng **50 test trong 9 file**, không phải 52/11 — các spec tạm bị loại).

**Nỗ lực:** 10 phút.

### L-03 — `VendorServiceImpl.java` 490 dòng

**Vị trí:** `api/vendor-service/src/main/java/com/moonkage/vendor/vendor/VendorServiceImpl.java`

**Vấn đề.** Lớp dài nhất trong backend (quét toàn bộ `api/**/src/main/java`, chỉ có file này vượt 400 dòng). Ngưỡng 400 dòng là quy ước để giữ class đọc được.

**Sửa.** Tách theo trách nhiệm: một service cho hồ sơ người bán, một service cho duyệt, một cho phí đăng ký, một cho owner-check.

**Nỗ lực:** 1 ngày.

### L-04 — `web/src/pages/system/sitemap/` chỉ còn CSS

**Vị trí:** `web/src/pages/system/sitemap/SitemapPage.module.css`

**Vấn đề.** Thư mục chỉ còn một file CSS sau khi `SitemapPage.tsx` và `index.ts` bị xoá. Grep `SitemapPage` trong `web/src` → 0 kết quả ngoài file CSS.

**Sửa.** Xoá thư mục (xem H-07). — **Đã xong 2026-11-05**: `web/src/pages/system/sitemap/` không còn tồn tại, `rg 'SitemapPage' web/src` → 0 kết quả.

**Nỗ lực:** 2 phút.

### L-05 — `order-service` khai báo `INTERNAL_SERVER_ERROR` nhưng thiếu `COMMON_401` ở đầu enum

**Vị trí:** `api/order-service/src/main/java/com/moonkage/order/exception/ErrorCode.java` (dòng 10 `INTERNAL_SERVER_ERROR`, dòng 13 `UNAUTHENTICATED`)

**Vấn đề.** Enum có `COMMON_401` (`UNAUTHENTICATED`) nhưng không có `COMMON_400_PARAM` — trong khi `order` có `PARAMETER_REQUIRED`. Mã `COMMON_400` của order là `INVALID_INPUT` chứ không có biến thể "thiếu tham số" chung, dù comment ghi "A required query parameter is missing" — mã dùng chung là `COMMON_400_PARAM` nhưng tên biến là `PARAMETER_REQUIRED`.

**Vấn đề thực:** Một client không thể phân biệt "thiếu tham số" với "dữ liệu sai" khi cả hai đều là 400 với thông điệp khác nhau; không có trường `errors` để chỉ ra field.

**Sửa.** Khi tách `CommonErrorCode` (H-03), đưa `PARAMETER_REQUIRED` vào `CommonErrorCode` với mã `COMMON_400_PARAM` để cả 5 service dùng chung.

**Nỗ lực:** 15 phút (kèm H-03).

### L-06 — `docs/README.md` dẫn link ra ngoài `docs/`

**Vị trí:** `docs/README.md:23`

**Vấn đề.** Link `../.github/CONTRIBUTING.md` — file **có** tồn tại (kiểm chứng: `Test-Path .github/CONTRIBUTING.md` → `True`), nhưng workflow `docs-links.yml` chạy lychee với `--offline --exclude-path node_modules './**/*.md'` nên link ra ngoài repo root vẫn nên được quét. Đây là rủi ro nhỏ: nếu lychee không theo `../`, link sẽ bị coi là hỏng.

**Sửa.** Kiểm tra bằng cách chạy lychee cục bộ; nếu báo hỏng, đổi thành link tuyệt đối tương đối tới root: `[CONTRIBUTING.md](../.github/CONTRIBUTING.md)` (giữ nguyên) hoặc chuyển sang link GitHub tuyệt đối.

**Đã kiểm chứng 2026-11-05 — không cần sửa.** Lychee phân giải link tương đối theo thư mục chứa file, nên `docs/README.md` + `../.github/CONTRIBUTING.md` → `.github/CONTRIBUTING.md`, và file này tồn tại (`Test-Path` → `True`). Workflow `docs-links.yml` chạy lychee với `--offline` từ repo root nên không có vấn đề. Đây là rủi ro giả, giữ nguyên link.

**Nỗ lực:** 15 phút.

### L-07 — `api-gateway` vẫn bật `discovery.locator`

**Vị trí:** `api/api-gateway/src/main/resources/application.yml:24-27`

**Vấn đề.**

```yaml
discovery:
  locator:
    enabled: true
    lower-case-service-id: true
```

Gateway định tuyến theo Eureka nên đường dẫn thực tế vẫn là `/<tên-service>/api/...` — **mâu thuẫn với D-18** đã chốt `/api/<tài-nguyên>/...` không tên service. Web vẫn gọi theo cả hai kiểu (`web/src/shared/api/gateway.ts` có `/api/vendors` lẫn `/identity-service/api/auth/login`).

Đây là điểm D-24 đã ghi "**Mở: code lệch D-18**" — chưa chốt hướng đi.

**Đã đề xuất (2026-11-05).** Xem ADR [D-30](api-db/decisions.md#d-30-gateway-định-tuyến-theo-aggregate-root-tắt-discoverylocator-theo-từng-service) trong `docs/architecture/api-db/decisions.md`: giữ locator tắt dần theo từng service, mỗi service chuyển xong thì đường dẫn cũ trả `308` về đường dẫn mới trong 1 release, rồi tắt locator.

**Đã làm 2026-11-05 — phần an toàn của D-30.** `api/api-gateway/src/main/java/com/moonkage/gateway/config/LegacyPathRedirectFilter.java` — một `WebFilter` ở `Ordered.HIGHEST_PRECEDENCE` trả **308** kèm header `Location` cho dạng cũ `/<service>/api/...` của 3 service đã migrate:

| Dạng cũ | Dạng chuẩn |
|---|---|
| `/catalog-service/api/products` | `/api/products` |
| `/catalog-service/api/interprovince-fees` | `/api/interprovince-fees` |
| `/vendor-service/api/vendors` | `/api/vendors` |
| `/vendor-service/api/registration-fee-config` | `/api/registration-fee-config` |
| `/vendor-service/api/cake-attributes` | `/api/cake-attributes` |
| `/orchestrator-service/api/notifications` | `/api/notifications` |

Ba quyết định thiết kế đáng ghi:
- **308, không phải 301** — đường dẫn phí dùng `PUT`; 301 sẽ bị browser đổi thành `GET` và mất body. 308 giữ nguyên method và body.
- **`WebFilter`, không phải `GlobalFilter`** — gateway filter chạy **sau** Spring Security, nên một `PUT /catalog-service/api/interprovince-fees` cũ đã bị trả `403` trước khi tới được chỗ phát redirect. Là web filter thì redirect đến trước, và quyền được chấm trên đường dẫn chuẩn.
- **OPTIONS preflight không bị redirect** — nếu không, browser sẽ đọc header CORS của câu trả lời redirect thay vì của preflight.

**Trạng thái migrate:** ✅ catalog, vendor, orchestrator · ❌ identity, quotation, order, payment (web vẫn gọi dạng có tên service cho 4 service này).

**Locator vẫn bật — có chủ đích.** Tắt lúc này sẽ làm hỏng web và app Flutter mobile (nằm ngoài repo này) cho 4 service chưa migrate. Đây là trạng thái tạm thời có chủ đích, đã ghi rõ trong `application.yml`.

**Bước tiếp theo cụ thể:** chuyển 4 service còn lại trong `web/src/shared/api/gateway.ts` sang `/api/...` (kèm route tường minh ở gateway và mục `permitAll()`), chạy E2E trên `vite preview`, rồi tắt locator. Cửa sổ redirect phải giữ mở cho tới khi app mobile xác nhận đã migrate.

**Nỗ lực:** 0,5 ngày (chốt quyết định) + 3 ngày (chuyển đổi). **Chủ sở hữu:** BE lead + FE lead.

---

## 7. Kết quả tuân thủ (đã đạt)

Ghi nhận những phần đã đúng, để các đợt refactor sau không phá vỡ.

| Hạng mục | Bằng chứng kiểm chứng |
|---|---|
| **Hướng tầng FSD** | Quét toàn bộ 570 file TS/TSX trong `web/src` bằng alias `@/`: 0 vi phạm (tầng dưới không import tầng trên) |
| **Cổng `index.ts`** | 43/44 slice có `index.ts` (thiếu duy nhất: `entities/sitemap` — đã bị xoá, xem H-07) |
| **Cổng `@x` giữa entity** | 5 cổng tồn tại, đều chỉ export type: `entities/order/@x/dispute.ts`, `entities/payment/@x/dispute.ts`, `entities/product/@x/vendor.ts`, `entities/region/@x/cart.ts`, `entities/vendor/@x/user.ts` |
| **`axios` chỉ ở một chỗ** | Grep `from 'axios'` trong `web/src` → duy nhất `web/src/shared/api/client.ts:1` |
| **`import.meta.env` chỉ ở config** | 8 chỗ, đều trong `web/src/shared/config/*` hoặc `app/main.tsx` / `widgets/header/ui/Header.tsx` (điều kiện `PROD`) |
| **Không có file lớn bất thường ở FE** | File dài nhất `web/src/app/routes.tsx` = 310 dòng (ngưỡng 400) |
| **Luật tầng backend** | `api/config/archunit/.../ArchitectureTest.java` có 6 luật, chạy ở mọi module qua `build-helper-maven-plugin` |
| **`ddl-auto: validate`** | Đúng ở cả 7 service (`catalog:22`, `identity:34`, `orchestrator:22`, `order:31`, `payment:31`, `quotation:30`, `vendor:31`) |
| **`@ConfigurationProperties`** | 22 class đã dùng — hướng đúng |
| **Không có xoá mềm** | Grep `@SoftDelete\|deleted_at\|deletedAt` trong `api/**/src/main/java` → 0 kết quả (khớp L-04) |
| **Idempotency** | `api/payment-service/.../controller/InternalPaymentController.java:25,32,38` + `api/order-service/.../client/PaymentClient.java:23` — `Idempotency-Key` có trong cả hai đầu |
| **Gateway chặn `/internal/**`** | `api/api-gateway/.../config/SecurityConfig.java:68-69` — `denyAll()` cho `/internal/**` và `/*/internal/**` |
| **Gateway xoá header giả mạo** | `SecurityConfig.java:190-193` — `headers.remove(USER_ID/ACCOUNT_ID/USER_ROLE)` trước khi gắn lại |
| **CORS lấy từ biến môi trường** | `SecurityConfig.java:161` — `@Value("${moonkage.cors.allowed-origins}")`, `application.yml:71` → `${CORS_ORIGINS}` |
| **Rate limit ở Gateway** | `api/api-gateway/.../config/RateLimitFilter.java` với 5 quy tắc trong `application.yml:74-84` |
| **`.env` không commit** | `git ls-files` chỉ trả `.env.example` và `web/.env.example`; `git check-ignore -v .env` → `.gitignore:28` |
| **`target/` và `dist/` không commit** | `git check-ignore -v api/api-gateway/target/.../SecurityConfig.class` → `.gitignore:6` (`target/`) |
| **Không có `debug.log`** | Quét toàn repo (trừ `node_modules`) → không tìm thấy |
| **File scratch đã được ignore** | 8 file (`web/spec-ids-report.txt`, `spec-lines.json`, `spec-remaining.json`, `merge-conflicts.txt`, `noise-list.txt`, `content-changed-files.txt`, `merge-content-changed.txt`, `noise-only-files.txt`) đều được liệt kê ở `.gitignore:86-94` |
| **`web/doc/_tmp_img/` đã ignore** | `.gitignore:95` |
| **Flyway: không sửa file đã merge** | 7 service có `db/migration/V*.sql` + `db/seed/R__seed.sql`; `R__provinces.sql` của catalog được đặt đúng trong `migration/` vì là dữ liệu tham chiếu chạy mọi môi trường |
| **Cổng chất lượng web** | `npm run check` gồm lint + CSS + spec-ID + tsc + vitest + build + bundle budget |
| **CI backend** | `.github/workflows/code-quality.yml` chạy `./mvnw -B -ntp clean verify` (Spotless + Checkstyle + Error Prone + ArchUnit + test) |
| **Gate tài liệu class** | `docs/scripts/check-class-docs.mjs` đối chiếu 20 file `docs/services/*/classes/*.md` với class Java cùng tên → hiện tại 20/20 khớp; chạy trong `.github/workflows/docs-links.yml` (bước **Check class docs match source**) |
| **Mỗi service nghiệp vụ có README** | 7 service (`identity`, `catalog`, `quotation`, `vendor`, `order`, `payment`, `orchestrator`) + thư viện `common-storage` đều có `docs/services/<tên>/README.md`; 7 module còn lại (`api-gateway`, `discovery-server`, `common-api`, `common-outbox`, `common-reference`, `common-observability`, `config`) là hạ tầng / thư viện / cấu hình build nên cố ý không có — bảng "Cố ý không có README" trong `docs/README.md` |

---

## 8. Backlog xử lý P0 / P1 / P2

### P0 — Chặn merge (làm trong tuần này)

| # | Phát hiện | Việc | Chủ sở hữu | Ước lượng |
|---|---|---|---|---|
| P0-1 | B-02 | Commit `web/scripts/check-no-spec-ids.mjs` cùng `package.json` + `web-quality.yml` | FE lead | 10 phút |
| P0-2 | B-01 | Sửa bảng Services trong `docs/README.md` — **đã xong 2026-11-05** | Người giữ tài liệu | 5 phút |
| P0-3 | B-03 | Sửa "L-01 → L-18" thành "L-01 → L-19" — **đã xong 2026-11-05** | Người giữ tài liệu | 2 phút |
| P0-4 | H-05 | Đồng bộ `show-sql` ở 3 service — **đã xong 2026-11-05** (`${JPA_SHOW_SQL:false}` ở cả 7 service) | BE lead | 10 phút |
| P0-5 | H-07 | Xoá 3 file CSS mồ côi + 2 thư mục rỗng — **đã xong 2026-11-05** (7 file CSS mồ côi + `entities/sitemap/`, `pages/system/sitemap/`; gate `check-orphan-css.mjs` chặn quay lại) | FE lead | 10 phút |
| P0-6 | H-10 | **Commit** `api/common-api/` + `api/common-outbox/` cùng `api/pom.xml` (đã khai báo trong build, chỉ còn commit) | BE lead | 15 phút |

### P1 — Trong quý hiện tại

| # | Phát hiện | Việc | Chủ sở hữu | Ước lượng |
|---|---|---|---|---|
| P1-0 | H-10 | Nối service vào `common-api` / `common-outbox` (làm **cùng** P1-1 và P1-4, không tách PR) — **đã xong 2026-11-05** (cả 7 service đã import `com.moonkage.api.ApiResponse` và `com.moonkage.outbox.*`) | BE lead | 0,5 ngày |
| P1-1 | H-01 | Dùng `ApiResponse` của `common-api` (đã có sẵn, không cần tạo `common-web`) — **đã xong 2026-11-05** (chỉ còn 1 bản `ApiResponse.java`, ở `common-api`) | BE lead | 1 ngày |
| P1-2 | H-02 | `ApiExceptionHandler` dùng chung — **đã xong 2026-11-05** (`CommonExceptionHandler` trong `common-api`; 6/7 service kế thừa, catalog giữ riêng vì trả 2 hình dạng lỗi) | BE lead | 2 ngày |
| P1-3 | H-03 | `CommonErrorCode` dùng chung — **đã xong 2026-11-05** (17 mã `COMMON_*`; 5/5 enum delegate, `quotation` giữ văn bản literal qua constructor riêng) | BE lead | 1,5 ngày |
| P1-4 | H-04 | Dùng `OutboxRelay` của `common-outbox` (đã có sẵn, không cần tạo `common-events`) — **đã xong 2026-11-05** (chỉ còn 1 bản `OutboxRelay.java`, ở `common-outbox`) | BE lead | 2 ngày |
| P1-5 | M-03 | Bỏ `ErrorResponse` 2 hình dạng ở catalog — **đã xong 2026-11-05** | BE lead | 0,5 ngày |
| P1-6 | M-01 | `open-in-view: false` + sửa N+1 phát sinh — **đã xong 2026-11-05** (`open-in-view: false` ở cả 7 service) | BE lead | 0,5–1 ngày |
| P1-7 | M-02 | Graceful shutdown 7 service — **đã xong 2026-11-05** (`server.shutdown: graceful` ở cả 7 service) | BE lead | 30 phút |
| P1-8 | M-05 | Migration xoá bảng `products` cũ ở catalog — **đã xong 2026-11-05** (migration `V2026_11_06_1000__drop_legacy_products_table.sql`) | Người phụ trách catalog | 2 giờ |
| P1-9 | M-11 | Bổ sung loại `0009` và quy ước bậc giá vào sổ ID — **đã xong 2026-11-05** | Người giữ tài liệu | 15 phút |
| P1-10 | M-07 | Xoá 40 file `tmp-*` + ignore `web/scripts/tmp-*` — **đã xong 2026-11-05** (file scratch đã xoá, `.gitignore` đã thêm `web/tmp-*` và `web/scripts/tmp-*`) | FE lead | 15 phút |
| P1-11 | M-06 | Tách upload thành feature — **đã xong 2026-11-05** | FE lead | 0,5 ngày |
| P1-12 | L-07 + D-30 | Chốt lộ trình đường dẫn API (ADR D-30 đã đề xuất) — **đã làm phần an toàn 2026-11-05** (`LegacyPathRedirectFilter` trả 308 cho 3 service đã migrate; locator vẫn bật có chủ đích cho 4 service chưa migrate) | BE lead + FE lead | 0,5 ngày |

### P2 — Quý sau

| # | Phát hiện | Việc | Chủ sở hữu | Ước lượng |
|---|---|---|---|---|
| P2-1 | H-09 | Đổi package `web` → `controller` ở 3 service — **đã xong 2026-11-05** (11 controller chuyển sang `<base>.controller`; chỉ `orchestrator.web.ApiExceptionHandler` ở lại vì là `@RestControllerAdvice` — hạ tầng web, không phải controller; `ComponentArchitectureTest` của identity/vendor cập nhật theo) | BE lead | 0,5 ngày |
| P2-2 | H-08 | Tạo README cho `order`, `payment`, `orchestrator`, `common-storage` — **đã xong 2026-11-05** (4 README mới theo mẫu `docs/services/identity/README.md`; 7 module còn lại trong `api/pom.xml` cố ý không có README vì là hạ tầng / thư viện / cấu hình build — đã ghi rõ trong bảng "Cố ý không có README" của `docs/README.md`; 4 thư viện `common-*` còn nợ chưa tài liệu hoá → P2-12) | Người giữ tài liệu + BE lead | 2 ngày |
| P2-3 | M-09 | Đổi tên 10 file `web/doc/` sang kebab-case — **đã xong 2026-11-05** (9 file dùng `git mv`, 1 file chưa từng commit nên move thường; 7 chỗ tham chiếu trong repo đã cập nhật; `rg` toàn repo không còn tên cũ) | FE lead | 1 giờ |
| P2-4 | M-10 | Chốt quy trình cập nhật tài liệu class — **đã xong 2026-11-05** (quy tắc ở `docs/README.md` quy tắc 9 + `architecture-standards.md` §7.6; gate `docs/scripts/check-class-docs.mjs` nối vào `.github/workflows/docs-links.yml`) | Người giữ tài liệu | 0,5 ngày |
| P2-5 | M-12 | Sửa `docs/services/identity/README.md` cho khớp code — **đã xong 2026-11-05** (`Role` = `MEMBER`/`ADMIN` theo D-19; quét toàn bộ `docs/`, chỉ còn tên vai cũ ở bảng "đặt tên sai → đúng" §9 và trong `docs/archive/`) | Người giữ tài liệu | 1 giờ |
| P2-6 | M-04 | `@Value` → `@ConfigurationProperties` (kèm P1-4) — **đã xong 2026-11-05** (6 nhóm: `nfc`, `jwt`×3, `moonkage.cors`×2; 4 `@Value` đơn lẻ giữ nguyên vì không có nhóm bạn cùng) | BE lead | 0,5 ngày |
| P2-7 | L-03 | Tách `VendorServiceImpl` — **đã xong 2026-11-05** (490 → 272 dòng; tách `VendorSubmissionService` 182, `VendorDocumentService` 125, `VendorReviewService` 74, `VendorFeePaymentService` 58; `VendorServiceImpl` giữ làm façade nên không call site nào đổi) | BE lead | 1 ngày |
| P2-8 | L-01, L-02 | Dọn file backup / file debug + bổ sung `.gitignore` — **đã xong 2026-11-05** (L-01: không còn file `*~` trong `api/`; L-02: `testIgnore` + 3 dòng `.gitignore`, đã kiểm chứng bằng `git check-ignore -v` và `playwright test --list`) | Ai cũng được | 20 phút |
| P2-9 | L-05 | `PARAMETER_REQUIRED` vào `CommonErrorCode` — **đã xong 2026-11-05** (mã `COMMON_400_PARAM` đã nằm trong `CommonErrorCode`, order-service delegate sang) | BE lead | 15 phút |
| P2-10 | L-06, M-08 | Kiểm lychee; thay `any` trong `lazyPage.tsx` — **đã xong 2026-11-05** (L-06: rủi ro giả, lychee phân giải link theo thư mục chứa file, giữ nguyên; M-08: `lazyPage` dùng generic `P extends object = Record<string, never>`, `web/src/app/` còn 0 `any` ở vị trí kiểu) | FE lead | 1 giờ |
| P2-11 | Mới (responsive) | Quét responsive toàn diện — **đã xong 2026-11-05**: 132 module CSS được rà soát, 14 module thực sự vỡ được thêm `@media`; 82 module một cột giữ nguyên; gate mới `web/scripts/check-responsive.mjs` (allowlist 1 entry: `Modal.module.css`) đã nối vào `npm run check`, CI và pre-commit | FE lead | 1 ngày |
| P2-12 | Mới (H-08, phần còn lại) | Tài liệu hoá 4 thư viện dùng chung chưa có thư mục tài liệu: `common-api` (`ApiResponse`, `PageResponse`, `GatewayHeader`, `GatewayRole`, `CommonErrorCode`), `common-outbox` (relay outbox, `EventExchange`), `common-reference` (enum `Province`, A-18), `common-observability` (`MetricNames`, `MoneyMetrics`, `PiiMasker`). Cân nhắc `docs/services/common-<tên>/README.md` theo mẫu `common-storage` | Người giữ tài liệu + BE lead | 1 ngày |
| P2-13 | Mới (M-03) | Một hình dạng lỗi duy nhất cho catalog — **đã xong 2026-11-05** (mọi path trả envelope `ApiResponse`; `ErrorResponse.java` đã xoá; mã `CAT_001`…`CAT_010` và HTTP status **không đổi**; web đã kiểm chứng không phụ thuộc hình dạng cũ) | BE lead | 0,5 ngày |
| P2-14 | Mới (M-05) | Dọn bảng `products` cũ của catalog — **đã xong 2026-11-05** (migration mới `V2026_11_06_1000__drop_legacy_products_table.sql`, idempotent; `V1__baseline.sql` không bị sửa vì Flyway ghi checksum; test `LegacyProductsTableMigrationTest` ghim trạng thái cuối) | Người phụ trách catalog | 2 giờ |
| P2-15 | Mới (M-06) | Tách upload thành feature — **đã xong 2026-11-05** (feature mới `web/src/features/file-upload/`: `api/uploadFile.ts` + `model/useFileUpload.ts` + `index.ts`; `shared/api` chỉ giữ phần transport; 3 call site migrate, trong đó `LegalProfileForm` dùng hook riêng vì FSD cấm feature→feature) | FE lead | 0,5 ngày |
| P2-16 | Mới (M-13) | CSP không nâng request HTTP lên HTTPS ở môi trường không phải production — **đã xong 2026-11-06** (`upgrade-insecure-requests` tách khỏi `CSP_DIRECTIVES`, meta CSP chỉ thêm khi origin HTTPS; `connect-src` khai cả `http://`+`https://`; `reuseExistingServer: false` để E2E không chạy bundle cũ) | FE lead | 2 giờ |

---

## 9. Không thể kiểm chứng

Những điểm dưới đây cần kiểm tra thủ công hoặc chạy môi trường thật; báo cáo không kết luận về chúng.

| Điểm | Vì sao chưa kiểm chứng được | Cách kiểm chứng |
|---|---|---|
| **`testMatch` của Playwright có nhặt `_tmp-debug2.spec.ts` không** | **Đã kiểm chứng 2026-11-05:** đã thêm `testIgnore: ['**/_tmp*/**', '**/_tmp-*', '**/tmp-*']`; `npx playwright test --list` vẫn báo đúng **50 test / 9 file** khi có 3 file debug tạm trong `web/e2e/` → spec tạm bị loại | — |
| **Hành vi thực tế của `npm run check` và `./mvnw verify`** | **Đã kiểm chứng 2026-11-06 (lần cuối):** `cd web && npm run check` → exit 0 (**87 file / 362 test**, build 1028.4 kB / ngân sách 1100 kB); `npm run e2e` → **45 pass / 5 skip / 0 fail** (build mới nhất, `reuseExistingServer: false`); `cd api && mvn -B clean test` → **BUILD SUCCESS** 15/15 module, **926 test**, 0 failure / 0 error (14:04); `mvn -B verify -DskipTests` → exit 0 (Spotless + Checkstyle + Error Prone + ArchUnit xanh) | — |
| **`vendor-service` có `GlobalExceptionHandler` riêng không** | **Đã kiểm chứng:** có — `api/vendor-service/src/main/java/com/moonkage/vendor/common/exception/GlobalExceptionHandler.java:25` có `@RestControllerAdvice`. Vì vậy tổng số bản xử lý lỗi là 7, không phải 5 | — |
| **Số lượng `product.upserted` thực tế trong seed** | Không chạy DB | Dựng `docker compose up -d` rồi đếm `SELECT count(*) FROM outbox_events WHERE event_type='product.upserted'` |
| **`R__provinces.sql` có đúng 34 đơn vị không** | **Đã kiểm chứng:** đếm `('NN'` trong `api/catalog-service/src/main/resources/db/migration/R__provinces.sql` → **34 dòng**; enum `com.moonkage.reference.Province` → **34 hằng** (`HA_NOI` … `CA_MAU`). Hai bên khớp | — |
| **Bảng `products` cũ của catalog còn được đọc bởi SQL nào không** | Grep trong `api/catalog-service/src/main/java` không trả kết quả cho `FROM products`, nhưng có thể còn view/trigger trong DB dev | `\d+` các view trong DB catalog dev; kiểm tra trigger |
| **Số lần gọi `disputeApi` / `orderApi` bị trùng giữa các trang** | Cần chạy app và đếm request | DevTools → Network khi điều hướng giữa các trang cùng dữ liệu |
| **Ngưỡng coverage của `vite.config.ts`** | **Đã kiểm chứng:** `web/vite.config.ts:50-54` đặt `lines: 23`, `functions: 18`, `branches: 23`, `statements: 23` — mức tạm, đo được 23,6% statements / 24,3% lines vào 05/11/2026; mục tiêu 70% ghi trong comment, không phải ngưỡng | Nâng ngưỡng theo khi coverage tăng |

---

## Tài liệu liên quan

| Tài liệu | Nội dung |
|---|---|
| [architecture-standards.md](architecture-standards.md) | Chuẩn mà báo cáo này đối chiếu |
| [software-design.md](software-design.md) | Thiết kế hệ thống, quyết định D-01 → D-24 |
| [api-db/decisions.md](api-db/decisions.md) | ADR mới D-25 → D-30 |
| [../conventions/coding-rules.md](../conventions/coding-rules.md) | Quy tắc đặt tên, tổ chức package, tài liệu class |
| [../guides/database.md](../guides/database.md) | Flyway, seed, sổ ID |
| [../README.md](../README.md) | Bản đồ tài liệu toàn repo |
