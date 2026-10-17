<!--
Tiêu đề PR phải theo Conventional Commits, vì khi squash merge nó trở thành commit trên main.
Ví dụ: feat(payment): thêm thanh toán bằng mã QR

Nâng cấp major (Java, Spring Boot, thư viện lên version major mới)?
Dùng template riêng: thêm ?expand=1&template=major_upgrade_template.md vào cuối URL tạo PR.
-->

## Mục đích

<!-- Vì sao cần thay đổi này? -->

Refs: <!-- PAY-142 -->

## Thay đổi chính

<!-- Tóm tắt ngắn gọn. Reviewer sẽ đọc diff, ở đây chỉ cần bức tranh lớn. -->

-

## Cách kiểm tra

<!-- Các bước để reviewer tự xác nhận. -->

1.

## Ảnh hưởng

<!-- Xoá dòng không áp dụng. Ghi rõ nếu có. -->

- [ ] Không có ảnh hưởng ngoài phạm vi thay đổi
- [ ] Breaking change (API, schema, cấu hình). Đã đánh dấu `!` trong tiêu đề:
- [ ] Có migration database:
- [ ] Thêm biến môi trường hoặc cấu hình mới:
- [ ] Thêm dependency mới (vì sao cần, lựa chọn khác đã cân nhắc, license):
- [ ] Rủi ro khác:

## Ảnh chụp màn hình

<!-- Chỉ khi có thay đổi giao diện. Không thì xoá mục này. -->

---

## Phần I · Local: người tạo PR tự xác nhận

- [ ] `./mvnw verify` (hoặc `./gradlew check`) **xanh ở máy tôi**
- [ ] Đã chạy `spotless:apply`, không có thay đổi format thủ công
- [ ] Có test cho hành vi mới; PR `fix` có test tái hiện lỗi
- [ ] Không xoá hay `@Disabled` test đang có
- [ ] Suppression (nếu có) đều kèm lý do; không hạ ngưỡng, không tắt rule
- [ ] Không có bí mật, không log dữ liệu nhạy cảm
- [ ] Đã tự đọc lại toàn bộ diff

## Phần II · Remote: quy ước chung

- [ ] Tên branch hợp lệ: `[agent/]<type>/<ticket>-<mo-ta-ngan>`
- [ ] Tiêu đề PR theo Conventional Commits
- [ ] Nhánh đã cập nhật với `main`
- [ ] PR đủ nhỏ để review (mục tiêu dưới 400 dòng thay đổi)

---

## PR do AI agent tạo

<!-- Bắt buộc với PR của agent (nhánh agent/..., label agent). PR của người thì xoá mục này. -->

- **Agent:** <!-- Claude Code / Copilot / Cursor ... -->
- **Người giao việc:** <!-- @username, người chịu trách nhiệm review hoặc chỉ định reviewer -->
- **Đã kiểm tra những gì:** <!-- lệnh đã chạy, kết quả -->
- **Giả định và điểm cần người kiểm tra:**
