src/
├── app/                          # [TẦNG 0: KHỞI TẠO & ĐIỀU PHỐI TOÀN CỤC]
│   ├── main.tsx                  # Điểm vào ứng dụng (Mount React & nạp CSS toàn cục)
│   ├── App.tsx                   # Khung Providers (AuthProvider, RealtimeProvider, CartProvider)
│   ├── routes.tsx                # Định tuyến & Lazy-load các Pages
│   ├── layouts/                  # Các Layout khung (ShopLayout, AccountLayout, SellerLayout, AdminLayout)
│   └── styles/                   # [NGUYÊN TẮC 3: TẦNG TOÀN CỤC]
│       ├── reset.css             # Xóa bỏ định dạng mặc định không nhất quán của các trình duyệt
│       ├── tokens.css            # Khai báo CSS Variables: --color-primary, --font-sans, --radius-sm...
│       └── global.css            # Các quy tắc chung cho body, html, typography cơ bản & khung nền tảng
│
├── pages/                        # [TẦNG 1: LẮP RÁP MÀN HÌNH - 1 Page = 1 Route]
│   ├── login/                    # Chỉ chứa code bố cục (Layout) lắp ghép các features,
│   │   └── LoginPage.tsx         # KHÔNG viết logic gọi API hay state phức tạp ở đây.
│   └── home/
│       └── HomePage.tsx
│
├── features/                     # [TẦNG 2: CÁC ĐƠN VỊ NGHIỆP VỤ ĐỘC LẬP]
│   ├── auth/
│   │   ├── api/                  # Các hàm gọi API đăng nhập/đăng ký (dùng client từ shared/api)
│   │   ├── model/                # Hooks (useAuth), State, Types và logic kiểm tra quyền
│   │   ├── ui/
│   │   │   ├── LoginForm.tsx
│   │   │   └── LoginForm.module.css  # [NGUYÊN TẮC 1 & 2: CÔ LẬP & ĐỒNG VỊ TRÍ]
│   │   │                             # - Dùng biến từ tokens.css
│   │   │                             # - Selector chỉ sâu 1 cấp (.form, .submitButton)
│   │   │                             # - Xóa LoginForm.tsx thì xóa luôn file này
│   │   └── index.ts              # [CỔNG PUBLIC API] Chỉ export những gì cho phép bên ngoài dùng
│   │
│   └── ...                       # Các nghiệp vụ khác của dự án
│
└── shared/                       # [TẦNG 3: NỀN TẢNG DÙNG CHUNG - VÔ TRI VỀ NGHIỆP VỤ]
    ├── api/                      # Cấu hình Axios/Fetch gốc, Interceptors, Socket client gốc
    ├── assets/                   # Hình ảnh, fonts, icons tĩnh
    ├── config/                   # Gom các cấu hình tĩnh toàn cục (env.ts, strings.ts, theme.ts)
    ├── ui/                       # CHỈ chứa UI Kit nguyên bản, cô lập kèm .module.css:
    │   ├── Button/
    │   │   ├── Button.tsx
    │   │   └── Button.module.css # UI Kit dùng chung: Style thuần túy theo Design System
    │   ├── Dialog/
    │   │   ├── Dialog.tsx
    │   │   └── Dialog.module.css
    │   └── index.ts
    └── utils/                    # Hàm thuần túy: format ngày tháng, tiền tệ, xử lý chuỗi
