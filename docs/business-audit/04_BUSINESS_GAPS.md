# 04 — Business Gaps & Requirements to Confirm

## 1. Tổng hợp

Tài liệu này không mặc định coi phần thiếu hoặc chưa chốt là bug.

| Phân loại | Số lượng |
|---|---:|
| `BUSINESS GAP` | **8** |
| `REQUIREMENT TO CONFIRM` | **6** |
| Ngoài phạm vi có chủ đích | 2 nhóm |

## 2. Gap cần xử lý

| ID | Loại | Nghiệp vụ còn thiếu/chưa rõ | Bằng chứng hiện tại | Quyết định cần có | Khuyến nghị |
|---|---|---|---|---|---|
| GAP-01 | BUSINESS GAP | Voucher | Checkout không có voucher contract/model/service; `AdminVouchersPage` ghi rõ hoãn. Requirements v1.4 cũng chốt BUY_NOW có thể dùng nhưng implementation deferred. | Có nằm trong release hiện tại không; nguồn tài trợ discount, điều kiện, budget/cap, hoàn voucher khi refund. | Giữ nhãn “chưa có” nếu ngoài release; nếu làm, thiết kế ledger discount trước khi thêm ô nhập ở checkout. |
| GAP-02 | REQUIREMENT TO CONFIRM | Cancellation/refund/order terminal state | `OrderStatus` không có `CANCELLED/REFUNDED`; không có cancel API. Q-01 vẫn mở, mọi trường hợp hiện đi dispute. | Ai được hủy ở mỗi state; mất cọc/stock/chi phí; late payment; refund khi đã disburse; trạng thái cuối. | Chốt state machine và money matrix trước; không thêm nút hủy đơn lẻ tẻ. |
| GAP-03 | REQUIREMENT TO CONFIRM | Delivery area của DIRECT custom request | OPEN match theo delivery area; DIRECT không check area. FR-42 cho phép custom được thương lượng, nhưng kỳ vọng UI/AC chưa hoàn toàn rõ. | DIRECT có được gửi ngoài vùng không; cần cảnh báo/confirm shipping hay chặn. | Nếu cho phép, hiển thị “giao hàng thương lượng” và yêu cầu quote có phí/ngày giao rõ. |
| GAP-04 | BUSINESS GAP | Unified refund lifecycle cho buyer/vendor | Dispute có decision/refund amount; payment có `PENDING/SUCCEEDED/MANUAL_REQUIRED`; order không consume refund completion và UI buyer không có state hoàn tiền end-to-end. | Ai thấy trạng thái nào; SLA/manual proof; notification khi refund complete. | Tạo read model/timeline `refund requested → processing → completed/manual`, không nhất thiết ép thành order status nếu GAP-02 chưa chốt. |
| GAP-05 | BUSINESS GAP | Combo/set/hộp quà và tồn kho thành phần | Product có attributes/description nhưng không thấy BOM/bundle component stock. | Combo là một SKU độc lập hay trừ tồn từng bánh/hộp; thay thế thành phần; expiry của set. | Với release nhỏ, xác nhận “combo là SKU độc lập”; nếu cần cấu hình set, thiết kế BOM + atomic reservation. |
| GAP-06 | REQUIREMENT TO CONFIRM | Promised delivery cho BUY_NOW nhiều Shop | Checkout dùng một province/address, mỗi Shop một order; không thấy delivery slot/requested date cho BUY_NOW. | Có cam kết ngày giao trước Trung thu không; từng Shop hay cả checkout; xử lý Shop không đáp ứng. | Bổ sung promised/estimated date per order chỉ sau khi có SLA/cutoff/capacity rule. |
| GAP-07 | BUSINESS GAP | Immutable order status history | Có current `Order.status`, progress updates và event outbox; không thấy API/entity status transition history đầy đủ cho mọi đổi state. | NFR/audit có yêu cầu lịch sử order đến mức nào; ai xem. | Lưu actor/from/to/reason/time/eventId; dùng cho support/dispute, không thay progress update tự do. |
| GAP-08 | BUSINESS GAP | Export báo giá | FR-18 nêu xuất báo giá; không thấy endpoint/file generation/UI hoàn chỉnh. | PDF/Excel, branding, dữ liệu cá nhân, version nào được xuất. | Chốt template và xuất immutable quote revision; đánh dấu deferred trong UI nếu chưa làm. |
| GAP-09 | BUSINESS GAP | Re-order | Entity request có `sourceOrderId` và comment deferred; không thấy flow FE/API hoàn chỉnh. | Copy gì từ order cũ; revalidate price/capability/NFC/address; custom artifacts có tái dùng không. | Re-order phải tạo request mới, không clone order/payment; revalidate toàn bộ. |
| GAP-10 | BUSINESS GAP | Capacity calendar của vendor | Có `VendorCapacityPage`/requirements FR-37 nhưng không thấy model/API capacity calendar quyết định matching/quote. | Capacity theo ngày/tuần, product/custom type, soft hay hard limit. | Không dùng page placeholder để hứa khả năng; chốt model rồi nối vào invitation/quote validation. |
| GAP-11 | BUSINESS GAP | Vận hành poison event/DLQ/replay | Outbox/inbox hỗ trợ retry, email có DLQ; chưa thấy business UI/runbook/replay cho payment→order, quote→order và stock failure dài hạn. | SLA, ownership, alert, replay authority, reconciliation job. | Có dashboard “paid but no order”, DLQ alert, safe replay và reconciliation idempotent trước production-like demo. |
| GAP-12 | REQUIREMENT TO CONFIRM | VNPay `confirm-on-return` | `application.yml` mặc định `${VNPAY_CONFIRM_ON_RETURN:false}`, nhưng flag có thể bật; BR-25 yêu cầu IPN quyết định. Không có config triển khai trong bằng chứng audit. | Có cấm tuyệt đối flag ở mọi environment trừ test không. | Fail startup hoặc bỏ mutate-on-return ở production profile; verify deployment config. |
| GAP-13 | REQUIREMENT TO CONFIRM | CCCD hết hạn sau khi đã verified | Server chặn thẻ đã hết hạn tại lúc verify; Q-33 còn mở cho expiry về sau. Account hiện giữ verified state. | Khi nào reverify; giao dịch đang chạy có bị chặn; grace period. | Lưu expiry chỉ nếu privacy policy cho phép, hoặc dùng derived reverifyAt; không hồi tố hủy order đang chạy nếu chưa có policy. |
| GAP-14 | REQUIREMENT TO CONFIRM | Thời hạn complaint chính xác | Code có complaint deadline và chặn dispute muộn; Q-10 trong requirements cần con số/policy cuối. | Số ngày, timezone, bắt đầu từ buyer confirm hay delivery evidence, xử lý không confirm. | Cấu hình tập trung, snapshot vào order và hiển thị countdown cho hai bên. |

## 3. Gap theo đặc thù bánh trung thu

| Tình huống | Trạng thái đánh giá |
|---|---|
| Hạn sử dụng | Có field nhưng thiếu invariant; đã ghi issue `AUD-008`. |
| Preorder/mùa vụ | Requirements v1.4 **cố ý không mô hình hóa mùa vụ**; không ghi bug. Nếu scope đổi phải mở requirement mới. |
| Giao trước ngày Trung thu/sự kiện | Với custom có request deadline nhưng quote chưa enforce (`AUD-009`); BUY_NOW chưa có promised date (`GAP-06`). |
| Hộp quà/combo/set | Chưa có BOM; `GAP-05`. |
| Số lượng lớn/custom | Quote/deposit/mockup/progress/remainder đã có; capacity/reorder/export còn gap. |
| Hết hàng lúc checkout | Reserve + pessimistic lock xử lý; UI cart availability bị mismatch (`AUD-004`). |
| Giá đổi giữa cart/checkout | Server refresh snapshot và reserve giá; cần UI diễn giải thay đổi tốt hơn nhưng không thấy sai tiền ở backend. |
| Nhiều vendor/lịch giao khác nhau | Một payment, một order/Shop đã có; delivery promise riêng chưa có (`GAP-06`). |
| Hủy khi đã chuẩn bị | Chưa chốt Q-01 (`GAP-02`). |
| Refund sau cancel/dispute | Dispute refund có; cancellation và unified refund state còn `GAP-02/GAP-04`. |

## 4. Những điểm không nên tự động bổ sung

- Không tự thêm season/preorder vì source of truth loại khỏi scope.
- Không tự thêm phần trăm hoa hồng; requirements đã bỏ commission.
- Không buộc buyer là pháp nhân cho B2B custom; BR-01/BR-21 nói nền tảng không kiểm loại khách này.
- Không áp voucher cho custom order; BR-32 loại trừ.
- Không biến vendor thành JWT role nếu ownership vẫn là mô hình chủ Shop động.
- Không suy diễn direct custom ngoài vùng giao là lỗi trước khi PO chốt GAP-03.

## 5. Bộ câu hỏi cần Product Owner trả lời trước remediation

1. State/money matrix cho cancel, reject fulfillment, partial production và refund sau disbursement là gì?
2. Delivery deadline là hard constraint hay một đề nghị có thể override khi accept quote?
3. BUY_NOW có promised delivery date/cutoff trước Trung thu không?
4. Combo là SKU độc lập hay bundle trừ tồn thành phần?
5. Complaint window và timezone chính thức?
6. Request không có quote thắng hết hạn khi nào?
7. Logout có nghĩa revoke thiết bị hiện tại hay chỉ xóa token trên UI?
8. Feature deferred nào thực sự thuộc release nghiệm thu: voucher, export quote, reorder, capacity?

