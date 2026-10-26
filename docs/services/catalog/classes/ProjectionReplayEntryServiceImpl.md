# Class Log: ProjectionReplayEntryServiceImpl

## 1. Thông tin chung và bất biến

Dependency ProjectionRecoveryRepository. Mỗi replay một transaction REQUIRES_NEW; lock raw inbox row và áp core cùng transaction. Không có business adapter production cho tới khi nhóm duyệt contract.

## 2. Method

| Method | Input | Output | Lỗi |
| --- | --- | --- | --- |
| replay | eventId, adapter đã chọn | ProjectionOutcome | CAT_010, adapter/DB errors |

## 3. Pseudocode

1. **Guard/lock:** đọc raw entry bằng eventId từ DB với FOR UPDATE; không tin payload caller tự gửi. Không có entry hoặc key adapter khác key lưu → conflict.
2. **Nghiệp vụ:** nếu processed marker đã có, kiểm cùng routingKey rồi trả DUPLICATE. Nếu chưa, gọi adapter bằng stored entry; adapter tương lai phải gọi core với eventId gốc.
3. **Persistence:** sau adapter phải tồn tại processed marker đúng id/key. Adapter no-op hoặc dùng sai key → conflict và rollback mọi mutation vừa làm. Adapter throw sau core → rollback marker/projection; raw entry còn pending. Không tự ghi marker thay adapter.
4. **Return:** outcome chỉ trả sau transaction thành công. Hai worker cùng entry serialize qua row lock; worker sau thấy marker không áp hai lần.

## 4. Giới hạn

Marker check bảo vệ invariant tối thiểu, không chứng minh adapter mapping đúng business schema. Việc duyệt/mapping contract và contract tests thuộc Phase D. Adapter mẫu trong integration test chỉ gọi core bằng row/identity fixture đã định sẵn để kiểm transaction, không parse field nghiệp vụ hay dựng nguồn replay giả.
