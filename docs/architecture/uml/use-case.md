# Sơ đồ Use Case

Mermaid không có kiểu sơ đồ use case riêng, nên sơ đồ dùng `flowchart` theo quy ước UML:

- Hình chữ nhật có «actor» là tác nhân. Hình bo tròn là use case.
- Khung lớn là ranh giới hệ thống Moonkage.
- Mũi tên «include» là bước luôn xảy ra, «extend» là bước tuỳ chọn.
- Nét đứt là phần chưa làm.

Nguồn: [requirements.md](../../product/requirements.md) mục 3 (vai trò) và mục 5 (FR), đối chiếu với controller của từng service.

## 1. Tác nhân

| Tác nhân | Là ai | Ghi chú |
|---|---|---|
| Khách | Người chưa đăng nhập | Chỉ xem và tìm sản phẩm |
| Thành viên (người mua) | Mọi tài khoản vai `MEMBER` | Kế thừa mọi use case của Khách |
| Chủ Shop | Thành viên sở hữu một Shop đã duyệt | **Không phải một vai riêng** (D-19). Quyền suy ra từ `Vendor.ownerAccountId`. Kế thừa mọi use case của Thành viên |
| Quản trị | Tài khoản vai `ADMIN` | Đội vận hành Moonkage |
| App Moonkage Verify | Hệ thống ngoài (app Android) | Đọc thẻ NFC, gửi dữ liệu thẻ đã mã hoá |
| VNPay | Hệ thống ngoài | Cổng thanh toán (sandbox) |
| Máy chủ email | Hệ thống ngoài | Gmail SMTP: mã xác nhận và đặt lại mật khẩu |

```mermaid
flowchart BT
    MEM["«actor»<br/>Thành viên"] -->|kế thừa| G["«actor»<br/>Khách"]
    OWN["«actor»<br/>Chủ Shop"] -->|kế thừa| MEM
    ADM["«actor»<br/>Quản trị"]
```

## 2. Tổng quan

```mermaid
flowchart LR
    G["«actor»<br/>Khách"]
    MEM["«actor»<br/>Thành viên"]
    OWN["«actor»<br/>Chủ Shop"]
    ADM["«actor»<br/>Quản trị"]
    APP["«actor»<br/>App Moonkage Verify"]
    VNP["«actor»<br/>VNPay"]
    SMTP["«actor»<br/>Máy chủ email"]

    subgraph SYS["Hệ thống Moonkage"]
        UC1(["Xem, tìm sản phẩm"])
        UC2(["Tài khoản và xác thực"])
        UC3(["Mua ngay"])
        UC4(["Đặt hàng qua báo giá"])
        UC5(["Khiếu nại"])
        UC6(["Đăng ký mở Shop"])
        UC7(["Bán hàng và xử lý đơn"])
        UC8(["Quản trị nền tảng"])
        UC9(["Xác minh NFC"])
    end

    G --- UC1
    G --- UC2
    MEM --- UC3
    MEM --- UC4
    MEM --- UC5
    MEM --- UC6
    MEM --- UC9
    OWN --- UC7
    ADM --- UC8
    UC2 --- SMTP
    UC3 --- VNP
    UC4 --- VNP
    UC6 --- VNP
    UC9 --- APP
```

## 3. Khách và Thành viên: tài khoản và mua ngay

```mermaid
flowchart LR
    G["«actor»<br/>Khách"]
    MEM["«actor»<br/>Thành viên"]
    SMTP["«actor»<br/>Máy chủ email"]
    VNP["«actor»<br/>VNPay"]

    subgraph SYS["Hệ thống Moonkage"]
        direction TB
        R(["Đăng ký có mã xác nhận<br/>FR-01"])
        L(["Đăng nhập, quên mật khẩu<br/>FR-02"])
        S(["Tìm, lọc, sắp xếp sản phẩm<br/>FR-05, FR-06"])
        D(["Xem chi tiết sản phẩm<br/>FR-07"])
        AD(["Quản lý địa chỉ giao hàng<br/>FR-03"])
        C(["Quản lý giỏ hàng nhiều Shop<br/>FR-08"])
        P(["Thanh toán đơn mua ngay<br/>FR-09"])
        V(["Dùng voucher<br/>FR-13 (chưa làm)"])
        PAY(["Thanh toán qua VNPay"])
        T(["Theo dõi đơn<br/>FR-10"])
        RC(["Xác nhận nhận hàng, đánh giá<br/>FR-11"])
        CP(["Khiếu nại đơn hàng<br/>FR-12"])
        CH(["Chat với Shop"])
    end

    G --- R
    G --- L
    G --- S
    G --- D
    MEM --- AD
    MEM --- C
    MEM --- P
    MEM -.- V
    MEM --- T
    MEM --- RC
    MEM --- CP
    MEM --- CH
    V -.->|«extend»| P
    P -.->|«include»| PAY
    R --- SMTP
    L --- SMTP
    PAY --- VNP
```

Thành viên kế thừa mọi use case của Khách (mục 1), nên không nối lại các đường của Khách.

## 4. Thành viên: đặt hàng qua báo giá

```mermaid
flowchart LR
    MEM["«actor»<br/>Thành viên"]
    APP["«actor»<br/>App Moonkage Verify"]
    VNP["«actor»<br/>VNPay"]

    subgraph SYS["Hệ thống Moonkage"]
        direction TB
        NFC(["Xác minh NFC chủ tài khoản<br/>FR-04"])
        RQ1(["Gửi yêu cầu trực tiếp<br/>FR-15"])
        RQ2(["Tạo yêu cầu mở<br/>FR-16"])
        CMP(["So sánh báo giá<br/>FR-17"])
        ACP(["Chấp nhận báo giá, đặt cọc<br/>FR-19"])
        INV(["Xin hoá đơn doanh nghiệp<br/>FR-24"])
        MK(["Duyệt maket<br/>FR-20"])
        PR(["Theo dõi tiến độ<br/>FR-21"])
        REM(["Thanh toán phần còn lại<br/>FR-22"])
        PAY(["Thanh toán qua VNPay"])
    end

    MEM --- NFC
    MEM --- RQ1
    MEM --- RQ2
    MEM --- CMP
    MEM --- ACP
    MEM --- MK
    MEM --- PR
    MEM --- REM
    RQ1 -.->|«include»| NFC
    RQ2 -.->|«include»| NFC
    INV -.->|«extend»| ACP
    ACP -.->|«include»| PAY
    REM -.->|«include»| PAY
    NFC --- APP
    PAY --- VNP
```

Gửi yêu cầu báo giá đòi tài khoản đã xác minh NFC (BR-23, kiểm ở `QuoteRequestController`). Mua ngay thì không cần.

## 5. Chủ Shop

```mermaid
flowchart LR
    MEM["«actor»<br/>Thành viên"]
    OWN["«actor»<br/>Chủ Shop"]
    VNP["«actor»<br/>VNPay"]

    subgraph SYS["Hệ thống Moonkage"]
        direction TB
        subgraph REG["Trở thành người bán"]
            K(["Khai hồ sơ người bán, tải giấy tờ<br/>FR-26"])
            KR(["Theo dõi kết quả duyệt, nộp lại<br/>FR-27"])
            FEE(["Đóng phí mở bán"])
        end
        subgraph SHOP["Bán hàng có sẵn"]
            AREA(["Khai vùng giao hàng<br/>FR-28"])
            PCRUD(["Đăng, sửa sản phẩm<br/>FR-29, FR-33"])
            STK(["Cập nhật tồn kho, giá, bậc giá<br/>FR-30, FR-31"])
            HIDE(["Ẩn, hiện sản phẩm<br/>FR-34"])
            ORD(["Xử lý đơn mua ngay<br/>FR-32"])
        end
        subgraph CUS["Nhận đặt hàng"]
            OP(["Khai hồ sơ nhận đặt hàng<br/>FR-35"])
            RQ(["Nhận yêu cầu, từ chối kèm lý do<br/>FR-36"])
            Q(["Soạn và gửi báo giá<br/>FR-38"])
            MK(["Gửi maket<br/>FR-39"])
            PG(["Cập nhật tiến độ<br/>FR-40"])
            DIS(["Yêu cầu giải ngân cọc<br/>FR-41"])
            INV(["Lập hoá đơn cho đơn<br/>FR-44"])
        end
        EV(["Gửi bằng chứng khiếu nại"])
        REC(["Xem đối soát<br/>FR-43"])
    end

    MEM --- K
    MEM --- KR
    MEM --- FEE
    FEE --- VNP
    OWN --- AREA
    OWN --- PCRUD
    OWN --- STK
    OWN --- HIDE
    OWN --- ORD
    OWN --- OP
    OWN --- RQ
    OWN --- Q
    OWN --- MK
    OWN --- PG
    OWN --- DIS
    OWN --- INV
    OWN --- EV
    OWN --- REC
```

Một Thành viên chỉ trở thành Chủ Shop khi hồ sơ được duyệt **và** đã đóng phí mở bán (`Vendor.canOperate()`, BR-20, BR-31).

## 6. Quản trị

```mermaid
flowchart LR
    ADM["«actor»<br/>Quản trị"]

    subgraph SYS["Hệ thống Moonkage"]
        direction TB
        A1(["Duyệt hồ sơ người bán<br/>FR-45"])
        A2(["Khoá Shop hoặc gỡ sản phẩm vi phạm<br/>FR-46"])
        A3(["Duyệt yêu cầu giải ngân cọc<br/>FR-47"])
        A4(["Chuyển tiền cho Shop khi đơn hoàn tất<br/>FR-48"])
        A5(["Phân xử khiếu nại, hoàn tiền<br/>FR-49"])
        A6(["Quản lý voucher<br/>FR-50 (chưa làm)"])
        A7(["Đối soát toàn nền tảng<br/>FR-51"])
        A8(["Đặt bảng phí giao liên tỉnh<br/>FR-52"])
        A9(["Đặt mức phí mở bán<br/>FR-53"])
        A10(["Quản lý danh mục vỏ, nhân bánh"])
        A11(["Xem nhật ký hệ thống"])
        A1a(["Yêu cầu bổ sung hoặc từ chối"])
        A5a(["Hoàn tiền qua VNPay"])
    end

    ADM --- A1
    ADM --- A2
    ADM --- A3
    ADM --- A4
    ADM --- A5
    ADM -.- A6
    ADM --- A7
    ADM --- A8
    ADM --- A9
    ADM --- A10
    ADM --- A11
    A1a -.->|«extend»| A1
    A5a -.->|«extend»<br/>khi quyết định hoàn tiền| A5
```
