# Ghi chú phiên làm việc 2026-10-17

> **Lưu trữ.** Tài liệu lịch sử, không cập nhật nữa và có thể đã khác code hiện tại. Hiện trạng: [docs/README.md](../README.md).

Làm ngay

1. Commit các thay đổi đang treo: catalog đổi sang X-Account-Id, phần FR-01 và FR-03, bỏ VendorDocument/AuditLog, và tách UserProfile. Gateway, identity, catalog và file-service phải được deploy cùng lúc, vì đã đổi header và API nội bộ.
2. Báo cả nhóm chạy script chuyển dữ liệu api/identity-service/db/2026-10-17_user_profiles.sql trên database local. Phải chạy khi identity-service đang dừng. Nếu không chạy, identity sẽ lỗi khi ghi địa chỉ hoặc vendor.
3. GEMINI.md → docs/GEMINI.md đang được staged sẵn, không phải do tôi. Bạn xem có commit chung đợt này hay tách riêng.

Must còn thiếu ở identity

4. FR-04 (xác minh NFC) chưa có gì. Gồm:
   - Các bảng legal_profiles, NfcSession, và trường khóa xác minh trên accounts.
   - API nfc-sessions và /card.
   - Mã hóa JWE và AES, băm HMAC với pepper.
   - API nội bộ nfc-status và id-numbers/check.

   FR-26 (BR-27), FR-15/16 (BR-23) và app mobile đều đang chờ phần này.

Lệch thiết kế, cần nhóm quyết

5. Tên vai: code dùng CUSTOMER và SELLER, nhưng D-19 đã chốt MEMBER và ADMIN, và chủ người bán không phải là một vai. Catalog đang chặn theo role == SELLER trong requireShop. Nghĩa là một tài khoản được duyệt làm người bán vẫn không đăng sản phẩm được, cho tới khi ai đó đổi vai cho nó, mà token cũ thì vẫn giữ vai cũ. Theo thiết kế, catalog nên tra bản sao người bán theo accountId.
6. Vendor đang nằm trong identity, trong khi thiết kế giao cho vendor-service. Cần chốt: tách service mới, hay sửa thiết kế để giữ lại trong identity.
7. Entity Vendor thiếu so với mục 7.1:
   - VendorEntityType chưa tách hộ kinh doanh / doanh nghiệp tư nhân / công ty, mà đây là nền của BR-26 và BR-27.
   - Còn thiếu representative_*, owner_check, onboarding_meeting, vùng giao, phí nội thành và phí đăng ký.
   - Tên trường legalName phải đổi thành business_name.

Lỗi nhỏ và nợ kỹ thuật

8. OTP xác nhận và OTP quên mật khẩu dùng chung một chỗ lưu theo email, nên mã của luồng này dùng được ở luồng kia. Nên tách theo mục đích.
9. Hai người đăng ký cùng email hoặc số điện thoại đúng cùng lúc thì người sau nhận lỗi 500 (vi phạm ràng buộc duy nhất), thay vì 409.
10. Chưa có test cho AuthServiceImpl (đăng ký, xác nhận, đăng nhập, quên mật khẩu). Hiện mới có test cho email, địa chỉ và số điện thoại.
11. Hai bảng thừa vendor_documents và audit_logs trong identity_db, cả hai 0 dòng. Có thể DROP.
12. Các cột buyerUserId / actorUserId ở order, tender và catalog giờ chứa accountId nhưng tên vẫn cũ. Nên đổi khi các service đó có migration riêng.
13. File cũ trên MinIO nằm theo userId cũ, nên chủ file không xóa được nữa. Chỉ là dữ liệu dev, có thể dọn bucket.
14. Không có công cụ migration (Flyway/Liquibase). Mọi service đang dùng ddl-auto: update, nên mỗi lần đổi tên cột hay bảng lại phải viết script tay như vừa rồi.
15. Cấu hình identity: show-sql: true làm log rất ồn, và có cảnh báo PostgreSQLDialect khai báo thừa.

Phía client

16. Frontend:
    - Xử lý otpSent: false khi đăng ký và lỗi 503 khi gửi lại mã.
    - Bỏ đọc userId khỏi LoginResponse (hiện chưa thấy chỗ nào dùng).
    - Làm màn hình quản lý địa chỉ, và giữ "địa chỉ đang chọn" để truyền areaCode khi lọc sản phẩm.

Đề xuất thứ tự: 1 → 2 → quyết mục 5 và 6 → làm FR-04 (mục 4) → 8 → 9 → 10. Mục 5 và 6 nên chốt trước FR-04 và FR-26, vì chúng quyết định FR-26 nằm ở service nào và catalog kiểm quyền người bán bằng cách nào.
 Không dựa vào code, hãy suy nghĩ về các thực thể trong DB kèm giải thích về mô hình

  Ran 1 shell command

Dưới đây là mô hình dữ liệu tôi đề xuất, dựng từ Requirement (mục 7) và Software Design, không nhìn vào code hiện tại. Chỗ nào tôi đề xuất khác mục 7.1, tôi ghi rõ lý do.

Các nguyên tắc chung

1. Một người có đúng một id: account_id. Mọi nơi ghi "ai làm" đều dùng id này: người mua, chủ người bán, quản trị, người thực hiện trong audit. BR-22 (cấm tự giao dịch) khi đó chỉ là phép so buyer_account_id = vendor.owner_account_id.
2. Mỗi service sở hữu dữ liệu của mình. Giữa các service không có khóa ngoại thật, chỉ lưu id. Service nào cần thông tin của service khác thì giữ một bản sao (snapshot), cập nhật theo sự kiện.
3. Giao dịch đã chốt thì chép lại dữ liệu tại thời điểm đó (BR-19). Đơn hàng lưu bản chép của giá, phí giao, địa chỉ và thông tin hóa đơn, không trỏ về dữ liệu gốc đang thay đổi.
4. Bản ghi nào có ý nghĩa pháp lý hoặc tài chính thì chỉ thêm, không sửa. Áp dụng cho báo giá đã gửi, phiên bản maket, tiến độ, kết quả so người bán, bút toán tiền và audit. Muốn "sửa" thì tạo bản mới.
5. Tiền luôn là số nguyên VND (NFR-09). Trạng thái là enum có luồng chuyển rõ ràng.

---

1. Danh tính (identity)

accounts 1──1 user_profiles
         1──0..1 legal_profiles
         1──* addresses
         1──* nfc_sessions

┌────────────────┬───────────────┬────────────────────────────────────────────────────────────────────────────────┐
│    Thực thể    │    Vai trò    │                                    Ghi chú                                     │
├────────────────┼───────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ accounts       │ Đăng nhập và  │ Email/số điện thoại (duy nhất, chỉ lưu ở đây), mật khẩu đã băm, status,        │
│                │ trạng thái    │ verified, role (MEMBER/ADMIN), nfc_failed_attempts, nfc_locked_until           │
├────────────────┼───────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ user_profiles  │ Thông tin     │ Khóa chính = account_id. Họ tên tự nhập, avatar. Đổi thoải mái, không có giá   │
│                │ hiển thị      │ trị pháp lý                                                                    │
├────────────────┼───────────────┼────────────────────────────────────────────────────────────────────────────────┤
│                │ Danh tính đã  │ Khóa chính = account_id. Có bản ghi nghĩa là đã xác minh. Chỉ giữ 5 trường     │
│ legal_profiles │ xác minh NFC  │ theo AC-04.11, lưu ở dạng mã hóa, băm hoặc che. Ràng buộc duy nhất             │
│                │               │ (id_number_hash, key_ver)                                                      │
├────────────────┼───────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ nfc_sessions   │ Phiên quét QR │ Dùng một lần, có hạn, thuộc đúng một tài khoản                                 │
├────────────────┼───────────────┼────────────────────────────────────────────────────────────────────────────────┤
│ addresses      │ Địa chỉ giao  │ area_code = tỉnh/thành (Q-12). Tối đa một địa chỉ mặc định                     │
└────────────────┴───────────────┴────────────────────────────────────────────────────────────────────────────────┘

Vì sao tách ba bảng cho tài khoản: ba nhóm dữ liệu có mức nhạy cảm và tần suất dùng khác nhau. accounts được đọc ở mọi request. user_profiles đổi tự do. legal_profiles là dữ liệu cá nhân nhạy cảm, nên chỉ code NFC được đụng tới (NFR-03).

2. Người bán (vendor)

vendors 1──* vendor_submissions (bất biến)
        1──* vendor_documents
        1──0..1 onboarding_meetings
        1──0..1 order_profiles
        1──* delivery_areas
registration_fee_configs (lịch sử mức phí)

┌──────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────┐
│         Thực thể         │                                        Ghi chú                                        │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│                          │ Trạng thái hiện tại của đơn vị kinh doanh. Gồm owner_account_id, business_name,       │
│ vendors                  │ entity_type (hộ kinh doanh / doanh nghiệp tư nhân / công ty), mã số thuế, trụ sở, tài │
│                          │  khoản ngân hàng, supply_source, sells_shop, accepts_orders, status,                  │
│                          │ local_delivery_fee, và các trường phí đăng ký (paid_at, amount, payment_id)           │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│                          │ Đề xuất khác 7.1. Mỗi lần nộp hoặc nộp lại tạo một bản ghi: thông tin người đại diện  │
│ vendor_submissions ⚠️    │ (representative_id_hash/masked) và owner_check (id_match, name_match, checked_at).    │
│                          │ Spec ghi owner_check "bất biến cho mỗi lần nộp", nên lưu thành lịch sử sẽ đúng hơn là │
│                          │  một trường bị ghi đè. Quản trị xem bản mới nhất, audit xem được cả chuỗi             │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│ vendor_documents         │ Giấy chứng nhận đăng ký, giấy an toàn thực phẩm, thỏa thuận hợp tác. Chỉ lưu đường    │
│                          │ dẫn file                                                                              │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│ onboarding_meetings      │ Chỉ dành cho công ty (BR-26): ngày làm việc, quản trị thực hiện, người đại diện, file │
│                          │  thỏa thuận, đã tra cứu cổng quốc gia                                                 │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│ order_profiles           │ Hồ sơ nhận đặt hàng: số lượng tối thiểu, bậc giá tham khảo, công suất, loại custom    │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│ delivery_areas           │ Bảng nối (vendor_id, area_code), không lưu thành mảng, để lọc theo vùng bằng index    │
├──────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│ registration_fee_configs │ Lưu lịch sử mức phí theo effective_from (FR-53). Mức hiện hành là bản ghi mới nhất    │
└──────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────┘

can_operate không lưu như một trường độc lập. Nó được tính ra từ status = APPROVED và đã đóng phí. Bản sao của nó ở các service khác chính là thứ catalog dùng để kiểm quyền người bán, thay cho vai SELLER.

3. Sản phẩm (catalog)

products 1──* product_price_tiers
         1──* stock_reservations
interprovince_fees (lịch sử theo tỉnh)
vendor_snapshots (bản sao từ vendor)

┌─────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────┐
│      Thực thể       │                                          Ghi chú                                           │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
│                     │ Giá niêm yết, stock (không tính phần đang giữ), hạn dùng, nhãn giao hàng, thương hiệu và   │
│ products            │ nơi sản xuất nếu bán lại, quote_threshold, status (đang bán / ẩn / bị gỡ). Không có thao   │
│                     │ tác xóa                                                                                    │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
│ product_price_tiers │ Bậc giá theo số lượng: (product_id, from_qty, unit_price)                                  │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
│ stock_reservations  │ BR-28. Giữ hàng theo lần thanh toán, có expires_at. Trạng thái đang giữ / đã chốt / đã     │
│                     │ trả. Trừ tồn kho bằng câu lệnh có điều kiện stock >= qty                                   │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
│ interprovince_fees  │ Phí giao liên tỉnh theo (province_code, effective_from)                                    │
├─────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
│ vendor_snapshots    │ vendor_id, owner_account_id, can_operate, sells_shop, delivery_areas, local_delivery_fee.  │
│                     │ Dùng để lọc sản phẩm và tính phí giao mà không phải gọi sang service khác                  │
└─────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────┘

4. Báo giá (quotation)

requests 1──* request_invitations 1──* quotes

┌─────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────┐
│      Thực thể       │                                          Ghi chú                                          │
├─────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
│ requests            │ Gồm buyer_account_id, type (trực tiếp / mở), số lượng, ngân sách, hạn chót,               │
│                     │ delivery_address (bản chép), custom, logo, status                                         │
├─────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
│                     │ Đề xuất khác 7.1, nơi đang dùng mảng invited_vendor_ids. Mỗi cặp (request_id, vendor_id)  │
│ request_invitations │ có trạng thái riêng (đã mời / đã xem / đã báo giá / từ chối). Yêu cầu trực tiếp chỉ là    │
│  ⚠️                 │ trường hợp có đúng một lời mời. Nhờ đó người bán truy vấn được "các yêu cầu gửi tới tôi", │
│                     │  và BR-16, BR-22 được kiểm khi tạo từng lời mời                                           │
├─────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
│                     │ Không sửa được sau khi gửi (BR-05). Gồm giá, phụ phí custom, tỷ lệ cọc, ngày giao, phí    │
│ quotes              │ giao, valid_until, status. Thu hồi một báo giá thì tạo báo giá mới. Khi một báo giá được  │
│                     │ chấp nhận, các báo giá khác của cùng yêu cầu đóng lại (BR-17)                             │
└─────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────┘

5. Đơn hàng (order)

carts 1──* cart_items
checkouts 1──* orders 1──* order_items
                    1──* mockup_versions
                    1──* progress_updates
                    1──0..1 dispute
                    1──* reviews

┌──────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────┐
│     Thực thể     │                                            Ghi chú                                            │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ cart_items       │ (buyer_account_id, product_id, qty). BR-22 được kiểm khi thêm vào giỏ                         │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ checkouts        │ Một lần thanh toán giỏ hàng nhiều Shop (BR-29). Id của nó chính là payment_group_id. Đây chưa │
│                  │  phải đơn: đơn chỉ được tạo khi có IPN thành công                                             │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ orders           │ Mỗi Shop một đơn. Gồm kind (mua ngay / đặt hàng), quote_id, bản chép địa chỉ và invoice_info, │
│                  │  phí giao, is_interprovince, status, mã vận đơn, file hóa đơn                                 │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ order_items ⚠️   │ Đề xuất khác 7.1, nơi items nằm trong order. Mỗi dòng là (product_id, tên/giá chép lại, qty). │
│                  │  Cần tách để đánh giá theo sản phẩm, để chốt stock_reservation, và để đối soát                │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ mockup_versions  │ Maket theo (order_id, version_no), không ghi đè. Trạng thái duyệt riêng cho từng phiên bản    │
│                  │ (BR-15)                                                                                       │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ progress_updates │ Lịch sử tiến độ, chỉ thêm                                                                     │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ disputes         │ Khiếu nại: lý do, bằng chứng, quyết định, số tiền hoàn. Khi còn mở thì giữ tiền (BR-18)       │
├──────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ reviews          │ Chỉ cho đơn mua ngay đã giao (BR-32). Duy nhất theo (order_id, product_id)                    │
└──────────────────┴───────────────────────────────────────────────────────────────────────────────────────────────┘

6. Tiền (payment)

┌─────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────┐
│        Thực thể         │                                        Ghi chú                                        │
├─────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│                         │ Mỗi lần gọi VNPay là một bản ghi. purpose gồm: mua ngay (gắn checkout_id), cọc / phần │
│ payments                │  còn lại (gắn order_id), phí đăng ký (gắn vendor_id). Có gateway_txn_ref duy nhất và  │
│                         │ kết quả IPN. Gắn với checkout chứ không gắn trực tiếp với đơn, vì một lần thanh toán  │
│                         │ sinh ra nhiều đơn                                                                     │
├─────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│                         │ Đề xuất khác 7.1, nơi Escrow là 4 cột số dư. Thay bằng bút toán chỉ thêm: (order_id,  │
│ ledger_entries ⚠️       │ type: HOLD / DISBURSE / REFUND / PAYOUT, amount, ref). Số dư tính bằng tổng. NFR-09   │
│                         │ khi đó là một bất biến kiểm được bằng truy vấn, và mỗi đồng tiền đều có dấu vết. Nếu  │
│                         │ cần đọc nhanh thì thêm bảng số dư được cập nhật cùng transaction                      │
├─────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│ disbursement_requests   │ Người bán xin giải ngân cọc: số tiền, mục đích, trạng thái, lý do từ chối. Khi được   │
│                         │ duyệt thì sinh bút toán DISBURSE                                                      │
├─────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│ refunds                 │ Lệnh hoàn tiền gửi VNPay và kết quả (NFR-07)                                          │
├─────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────┤
│ vouchers +              │ Cần bảng ghi nhận lượt dùng để kiểm max_uses một cách nguyên tử. Hiện đang hoãn       │
│ voucher_redemptions     │ (FR-13, FR-50)                                                                        │
└─────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────┘

7. Hỗ trợ (notification và hạ tầng)

┌────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────┐
│        Thực thể        │                                        Ghi chú                                         │
├────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ notifications          │ Thông báo trong ứng dụng theo account_id, có cờ đã đọc (NFR-10)                        │
├────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ audit_logs             │ Chỉ thêm, đặt tập trung một chỗ: ai làm, lúc nào, giá trị trước/sau, lý do (NFR-07).   │
│                        │ Các service đẩy sự kiện vào                                                            │
├────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
│ outbox (mỗi service    │ Sự kiện được ghi trong cùng transaction với dữ liệu nghiệp vụ, sau đó mới đẩy lên      │
│ một bảng)              │ RabbitMQ, để không mất sự kiện khi lỗi giữa chừng (NFR-05)                             │
└────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────┘

---

Ba điểm cần nhóm chốt

1. Bốn chỗ tôi đề xuất khác mục 7.1 (đánh dấu ⚠️): vendor_submissions, request_invitations, order_items, ledger_entries. Cả bốn đều chỉ tách thực thể cho chuẩn hơn, không đổi nghiệp vụ. Nếu nhóm đồng ý thì nên cập nhật 7.1 và Software Design.
2. Vendor nằm ở service nào. Mô hình trên coi vendor là một service riêng như thiết kế. Nếu giữ trong identity thì các bảng vẫn y như vậy, chỉ khác chỗ đặt.
3. Không còn vai SELLER. "Là người bán" được suy ra từ việc tài khoản sở hữu một vendor có can_operate = true, không ghi trong JWT.


Đã thêm 3 service còn thiếu so với Software Design: vendor-service, payment-service và notification-service. Mỗi service mới chỉ là khung rỗng, chưa có entity hay API nào. Cả 3 khởi động được, đã đăng ký vào Eureka, và gateway gọi tới /v3/api-docs của từng service đều trả 200. Build Maven toàn bộ 11 module pass.

┌──────────────────────┬──────┬───────────────────────┬───────────────────────────────────────────────────────────┐
│       Service        │ Cổng │ Database (cổng trên   │                  Phụ trách theo thiết kế                  │
│                      │      │         máy)          │                                                           │
├──────────────────────┼──────┼───────────────────────┼───────────────────────────────────────────────────────────┤
│ vendor-service       │ 8086 │ vendor_db (5445)      │ Hồ sơ và duyệt người bán, vùng giao, hồ sơ nhận đặt hàng, │
│                      │      │                       │  phí đăng ký                                              │
├──────────────────────┼──────┼───────────────────────┼───────────────────────────────────────────────────────────┤
│ payment-service      │ 8087 │ payment_db (5446)     │ VNPay/IPN, sổ giữ tiền, giải ngân cọc, chuyển tiền cho    │
│                      │      │                       │ người bán, hoàn tiền                                      │
├──────────────────────┼──────┼───────────────────────┼───────────────────────────────────────────────────────────┤
│ notification-service │ 8088 │ notification_db       │ Thông báo trong ứng dụng, audit log toàn nền tảng         │
│                      │      │ (5447)                │                                                           │
└──────────────────────┴──────┴───────────────────────┴───────────────────────────────────────────────────────────┘

Những gì đã thêm:
- Khung mỗi service: dựng theo đúng mẫu của tender-service (pom.xml, Dockerfile, class *Application, DotEnvConfig, OpenApiConfig, application.properties).
- Nối vào dự án:
  - Thêm module vào api/pom.xml.
  - Thêm dòng copy pom của 3 module mới vào cả 7 Dockerfile cũ. Bước này bắt buộc vì pom cha liệt kê mọi module.
  - Thêm 3 database và 3 service vào docker-compose.yml.
  - Thêm Swagger của 3 service vào gateway.
- Biến môi trường: thêm VENDOR_/PAYMENT_/NOTIFICATION_DB_HOST và _PORT vào .env.example, và cả file .env local của bạn. Thiếu các biến này thì service không khởi động được. Những người khác trong nhóm cần tự thêm 6 dòng này vào .env của họ.

Chưa động tới:
- tender-service đang làm phần mà thiết kế gọi là quotation-service. Tôi giữ nguyên tên, chưa đổi.
- RabbitMQ có trong phần hạ tầng của thiết kế nhưng chưa có trong compose. Khi bắt đầu dùng sự kiện thì cần thêm.
- README.md và docs/project-structure.md vẫn liệt kê 7 service, chưa cập nhật.
- Vendor vẫn đang nằm trong identity-service. Chuyển sang vendor-service là việc riêng, cần bạn quyết.


Dưới đây là nhận xét về api/ sau các thay đổi vừa rồi, đối chiếu với Software Design.

Mức độ hoàn thiện hiện tại

┌───────────────────┬───────────────────────────────────────────────────────────────────────────────────────────┐
│      Service      │                                        Thực trạng                                         │
├───────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
│ identity          │ Có nghiệp vụ thật: đăng ký, đăng nhập, địa chỉ. Có 12 test. Thiếu FR-04 (NFC)             │
├───────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
│ catalog           │ Chỉ có phần sản phẩm là thật: ProductServiceImpl 279 dòng, 8 endpoint. DeliveryArea,      │
│                   │ OrderProfile, Review mới có entity, controller rỗng                                       │
├───────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
│ vendor            │ Vừa chuyển sang: đọc được vendor, có seeder. Chưa có khai hồ sơ hay duyệt                 │
├───────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
│ quotation, order  │ Chỉ có khung. Đủ entity, repository, service và controller, nhưng mọi controller và       │
│                   │ service đều rỗng (13–25 dòng, 0 endpoint)                                                 │
├───────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
│ payment,          │ Khung rỗng                                                                                │
│ notification      │                                                                                           │
├───────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
│ file              │ Có upload, xóa, presigned URL lên MinIO                                                   │
└───────────────────┴───────────────────────────────────────────────────────────────────────────────────────────┘

Nhìn chung, ranh giới các service đã đúng tên theo thiết kế. Nhưng phần ruột của catalog, order và quotation còn mang mô hình cũ (Bake2B/Capstone). Đây là điểm cần xử lý trước khi viết nghiệp vụ, vì entity đặt sai chỗ ngay từ đầu thì càng viết nhiều code trên nó càng khó sửa.

Điểm tốt

- Mỗi service một database, chỉ đi qua gateông mở cổng ra máy host.
- Gateway xóa rồi gắn lại header danh tính, và chặn /*/internal/** từ bên ngoài.
- Tầng quản lý chất lượng code đồng bộ: Spoe chạy cho mọi module. Dockerfile dùng build nhiều tầng với cache Maven.
- Cấu trúc package giống nhau giữa các servrepository/entity/dto/enums/client/config),nên người mới vào dễ đọc.

Vấn đề

│ quotation, order  │ Chỉ có khung. Đủ entity, repository, service và controller, nhưng mọi controller và       │
│                   │ service đều rỗng (13–25 dòng, 0 endpoint)                                                 │
├───────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
│ payment,          │ Khung rỗng                                                                                │
│ notification      │                                                                                           │
├───────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┤
│ file              │ Có upload, xóa, presigned URL lên MinIO                                                   │
└───────────────────┴───────────────────────────────────────────────────────────────────────────────────────────┘

Nhìn chung, ranh giới các service đã đúng tên theo thiết kế. Nhưng phần ruột của catalog, order và quotation còn mang mô hình cũ (Bake2B/Capstone). Đây là điểm cần xử lý trước khi viết nghiệp vụ, vì entity đặt sai chỗ ngay từ đầu thì càng viết nhiều code trên nó càng khó sửa.

Điểm tốt

- Mỗi service một database, chỉ đi qua gateway. Trong Docker, service không mở cổng ra máy host.
- Gateway xóa rồi gắn lại header danh tính, và chặn /*/internal/** từ bên ngoài.
- Tầng quản lý chất lượng code đồng bộ: Spotless, Checkstyle, Error Prone chạy cho mọi module. Dockerfile dùng build nhiều tầng với cache Maven.
- Cấu trúc package giống nhau giữa các service (controller/service/impl/repository/entity/dto/enums/client/config), nên người mới vào dễ đọc.

Vấn đề

1. Entity đặt lệch so với thiết kế (nghiêm trọng nhất)

┌──────────────────────────────────┬──────────────────────┬──────────────┬─────────────────────────────────────┐
│              Entity              │      Đ │               Ghi chú               │
│                                  │                      │      kế      │                                     │
├──────────────────────────────────┼────────┼─────────────────────────────────────┤
│ OrderProfile, DeliveryArea,      │                      │              │ Hồ sơ nhận đặt hàng và vùng giao là │
│ RefPriceTier                     │ catalo │  thuộc tính của người bán (FR-28,   │
│                                  │                      │              │ FR-35)                              │
├──────────────────────────────────┼────────┼─────────────────────────────────────┤
│ Review                           │ catalog              │ order        │ Đánh giá gắn với đơn đã giao        │
│                                  │        │ (BR-32)                             │
├──────────────────────────────────┼──────────────────────┼──────────────┼─────────────────────────────────────┤
│ Payment, Ledger,                 │ order  │ payment-service đang rỗng trong khi │
│ DisbursementRequest              │                      │              │  tiền lại nằm ở order               │
├──────────────────────────────────┼────────┼─────────────────────────────────────┤
│ CommissionConfig,                │                      │              │ BR-10 đã bỏ hoa hồng; nguồn thu là  │
│ CommissionInvoice,               │ order  │ phí đăng ký mở bán                  │
│ CommissionController             │                      │              │                                     │
├──────────────────────────────────┼────────┼─────────────────────────────────────┤
│ Season, SeasonController         │ quotation            │ bỏ           │ Spec ghi rõ không có hạn chót mùa   │
│                                  │        │ (mục 4.2, BR-14)                    │
├──────────────────────────────────┼──────────────────────┼──────────────┼─────────────────────────────────────┤
│                                  │ catalo │                                     │
│ AuditLog                         │ quotation (mỗi nơi   │ notification │ NFR-07 cần một nhật ký tập trung    │
│                                  │ một bả │                                     │
└──────────────────────────────────┴──────────────────────┴──────────────┴─────────────────────────────────────┘
Vì các service này chưa có nghiệp vụ và dữ liệu, sửa ngay bây giờ gần như không tốn gì: chỉ cần chuyển hoặc xóa fivà tạo lại bảng. Để sau khi đã có code thì
                                                                                                                  2. Phân quyền người bán dựa trên vai SELLER
                                                                                                                  Gateway có rule hasRole("SELLER") cho /cata catalog kiểm tra role == SELLER một lầnnữa. Theo D-19, "là người bán" không phải một vai. Hệ quả: khi admin duyệt người bán, tài khoản đó vẫn mang vai   CUSTOMER, nên không đăng được sản phẩm. Selc gán vai SELLER bằng tay. Nên bỏ rule ởgateway, và để catalog kiểm can_operate qua vendor-service (sau này là bản sao vendor).
3. Đường dẫn qua gateway lộ tên service
Gateway đang tự tạo route theo tên service (/identity-service/..., /catalog-service/...). Thiết kế mục 5.1 dùng bảtiền tố theo nghiệp vụ (/api/vendors/** → v* → catalog). Với cách hiện tại, mỗi lầnđổi tên hoặc tách service là client phải đổi URL (tender → quotation vừa rồi là ví dụ). Nên chuyển sang route khaibáo tường minh trước khi web và mobile gọi
                                                                                                                  4. Service tin header mà không tự kiểm
                                                                                                                  Các service đọc X-Account-Id và X-User-Rolehệ thống chỉ an toàn khi mọi request đều qua gateway. Trong Docker thì đúng như vậy. Nhưng khi chạy từ IDE (README cách B), các service mở cổng 8081–8088 trên máy, và ai cũng gọi thẳng được kèm header g Với môi trường demo có thể chấp nhận, nhưng nên ghi rõ, hoặc cho mỗi service kiểm lại JWT bằng cùng khóa.

5. Code dùng chung bị chép lại

- DotEnvConfig có 9 bản giống hệt nhau, chỉ khác dòng package. OpenApiConfig cũng vậy.
- Xử lý lỗi không đồng nhất: chỉ identity vdvice. Các service khác trả lỗi mặc định của Spring, không theo định dạng {status, error, message, path, timestamp} mà thiết kế yêu cầu.
- DTO giữa các service được chép tay (Vendo nhau là lỗi chỉ lộ ra lúc chạy.

Đề xuất: thêm một module common chứa DotEnvesponse + handler dùng chung, và hằng số tên header. Hợp đồng DTO giữa các service có thể giữ chép tay, nhưng cần test hợp đồng hoặc ít nhất ghi chú "mirror của
…".

6. Hạ tầng dữ liệu

- Mọi service dùng ddl-auto: update, không nay đã phải viết 2 script chuyển dữ liệubằng tay, và một số thay đổi (đổi tên cột) không làm được an toàn. Nên thêm Flyway từ bây giờ, khi các schema còn
  gần như trống.
- show-sql: true ở 7 service làm log rất nhiễu.
- RabbitMQ đã có nhưng chưa có bảng outbox  việc phải làm khi dựng bản sao vendor chocatalog, order và quotation.

7. Test

Toàn bộ backend có 3 lớp test, đều ở identity. Catalog có 279 dòng nghiệp vụ (kiểm quyền, sửa giá, ghi audit) mà
không có test nào.

Thứ tự đề xuất

1. Dọn ranh giới service (mục 1):
   - Chuyển OrderProfile và DeliveryArea sang vendor, Review sang order, Payment/Ledger/DisbursementRequest sang
     payment.
   - Xóa Commission* và Season.
   - Gom AuditLog về notification.
2. Bỏ vai SELLER (mục 2), kiểm quyền người bán qua vendor.
3. Thêm module common và Flyway (mục 5, 6),
4. Chuyển gateway sang route theo tiền tố (mục 3), trước khi frontend gọi nhiều API.
5. Sau đó mới viết nghiệp vụ: FR-04, FR-26/


Đã dọn xong ranh giới service. Toàn bộ 11 module build pass. Các service khởi động không lỗi, và luồng audit qua RabbitMQ đã chạy thử từ đầu tới cuối.

Đã chuyển và xóa

┌─────────────────────────────────┬───────────────┬───────────────────────────────┐
│            Nội dung             │      Từ       │             Sang              │
├─────────────────────────────────┼───────────────┼───────────────────────────────┤
│                                 │               │ vendor. Giờ có khóa ngoại     │
│ OrderProfile, RefPriceTier,     │ catalog       │ thật tới vendors (vendor_id), │
│ DeliveryArea, CustomType        │               │  không còn lưu vendorId dạng  │
│                                 │               │ chuỗi                         │
├─────────────────────────────────┼───────────────┼───────────────────────────────┤
│ Review                          │ catalog       │ order. buyerUserId đổi thành  │
│                                 │               │ buyerAccountId                │
├─────────────────────────────────┼───────────────┼───────────────────────────────┤
│                                 │               │ payment. Liên kết sang Order  │
│ Payment, Ledger,                │ order         │ đổi thành cột order_id dạng   │
│ DisbursementRequest cùng 4 enum │               │ chuỗi (khác service nên không │
│                                 │               │  có khóa ngoại)               │
├─────────────────────────────────┼───────────────┼───────────────────────────────┤
│ Commission* (entity, repo,      │               │                               │
│ controller, service),           │ order         │ xóa (BR-10)                   │
│ Ledger.commission,              │               │                               │
│ Order.commissionRate            │               │                               │
├─────────────────────────────────┼───────────────┼───────────────────────────────┤
│ Settlement* rỗng                │ order         │ xóa. Đối soát giờ thuộc       │
│                                 │               │ payment                       │
├─────────────────────────────────┼───────────────┼───────────────────────────────┤
│ Season*                         │ quotation     │ xóa (BR-14)                   │
├─────────────────────────────────┼───────────────┼───────────────────────────────┤
│                                 │ catalog,      │                               │
│ AuditLog                        │ order,        │ notification, chỉ còn 1 bản   │
│                                 │ quotation (3  │                               │
│                                 │ bản)          │                               │
└─────────────────────────────────┴───────────────┴───────────────────────────────┘

Hai controller rỗng OrderProfileController và DeliveryAreaController trước đây có URL thuộc catalog, nên tôi không mang sang vendor. Khi làm FR-28 và FR-35 sẽ viết lại dưới /api/seller/vendor/** theo thiết kế. Gateway cũng đã đổi rule xem công khai: reviews giờ thuộc order-service, order-profiles đã bỏ.

Audit qua RabbitMQ

- Phía phát (catalog): sự kiện được gửi sang exchange moonkage.events (routing key audit.catalog) sau khi transaction commit, nên thay đổi bị rollback sẽ không bị ghi log.
- Phía nhận (notification): hàng đợi bền notification.audit nhận mọi khóa audit.#, rồi lưu vào audit_logs. Bảng có thêm source_service và thời điểm xảy ra. Tin nhắn lỗi được thử lại 3 lần rồi bỏ, không lặp vô hạn.
- Kết quả chạy thử: seller tạo sản phẩm rồi đổi giá và tồn kho. notification_db nhận đủ 2 dòng PRODUCT_PRICE_CHANGED (100000 → 120000) và PRODUCT_STOCK_CHANGED (5 → 7), đúng actor_account_id. Dữ liệu test đã xóa.

Database

Các bảng cũ không tự mất vì đang dùng ddl-auto: update. Tôi viết script api/db/2026-10-17_service_boundaries.sh để dọn chúng: script chỉ xóa bảng trống, gặp bảng có dữ liệu thì dừng. Đã chạy trên máy local và xóa 14 bảng cùng cột orders.commission_rate. Riêng cột này là NOT NULL, nếu để lại thì mọi lệnh tạo đơn sau này sẽ lỗi. Những người khác trong nhóm cần chạy script này một lần.

Bảng hiện nằm đúng chỗ: vendor_db có hồ sơ nhận đặt hàng và vùng giao, payment_db có các bảng tiền, notification_db có audit_logs, catalog_db chỉ còn sản phẩm.

Còn tồn, chưa làm trong bước này

- Catalog chưa lọc sản phẩm theo vùng giao. Trước đây cũng chưa có, nhưng giờ vùng giao nằm ở vendor, nên cần bản sao vendor gửi qua sự kiện.
- Audit chưa có bảng outbox: nếu RabbitMQ đang sập đúng lúc commit thì sự kiện bị mất (đã ghi log lỗi).
- Bản ghi sự kiện và tên exchange đang chép tay ở 2 nơi. Nên gom vào module common (mục 5 của nhận xét trước).
- Mô hình payment vẫn là mô hình cũ: gắn với đơn, chưa có checkout hay phí đăng ký, Ledger vẫn là các cột số dư. Review còn trường vendorReply dù spec ghi người bán không được trả lời đánh giá. Các cột buyerUserId trong order và quotation vẫn chưa đổi tên.

README đã cập nhật mô tả các service. Thay đổi chưa được commit. Bước tiếp theo trong danh sách là mục 2: bỏ vai SELLER và kiểm quyền người bán qua vendor.



Phần README đã cập nhật gồm:

- Sơ đồ kiến trúc: đổi tender thành quotation. Thêm vendor, payment, notification cùng database của từng service. Thêm luồng gọi catalog → vendor và vendor → identity.
- Bảng service: mô tả mới cho từng service, thêm 3 service mới và RabbitMQ. Phần PostgreSQL giờ là 7 database, cổng 5441–5447.
- Hướng dẫn chạy từ IDE (cách B): lệnh docker compose có thêm các database mới và rabbitmq, kèm lệnh chạy 3 service mới.
- Cây thư mục: thêm 3 service mới và thư mục api/db/.

Khi rà lại tôi sửa thêm 2 lỗi do chính tôi để sót: sơ đồ vẫn còn mũi tên catalog → identity (catalog giờ không gọi identity nữa), và db/ bị đặt xen giữa các service trong cây thư mục.

Vẫn còn 2 chỗ README mô tả chưa khớp với code:
- Identity được ghi là có "xác minh NFC", nhưng FR-04 chưa được làm.
- README vẫn viết gateway định tuyến theo tên service (/identity-service/...). Mô tả này đúng với hiện tại; chỉ cần sửa nếu sau này chuyển sang định tuyến theo tiền tố.

docs/project-structure.md vẫn mô tả cấu trúc cũ, tôi chưa sửa.
