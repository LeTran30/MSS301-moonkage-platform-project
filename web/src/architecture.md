src/
├── app/ # [TẦNG 0: KHỞI TẠO & ĐIỀU PHỐI TOÀN CỤC]
│ ├── main.tsx # Điểm vào ứng dụng (Mount React)
│ ├── App.tsx # KhungProviders (Theme, QueryClient, AuthProvider)
│ ├── routes.tsx # (Từ routes.ts cũ) Định tuyến & Lazy-load các Pages
│ └── styles/ # (Từ styles/ & index.css cũ) CSS toàn cục, Reset CSS
│
├── pages/ # [TẦNG 1: LẮP RÁP MÀN HÌNH - 1 Page = 1 Route]
│ ├── login/ # Chỉ chứa code bố cục (Layout) lắp ghép các features,
│ │ └── LoginPage.tsx # KHÔNG viết logic gọi API hay state phức tạp ở đây.
│ └── dashboard/
│ └── DashboardPage.tsx # Ví dụ: Ghép <UserProfile /> (từ auth) + <LiveFeed /> (từ realtime)
│
├── features/ # [TẦNG 2: CÁC ĐƠN VỊ NGHIỆP VỤ ĐỘC LẬP]
│ ├── auth/ # (Chuyển thư mục auth/ ở gốc vào đây)
│ │ ├── api/ # Các hàm gọi API đăng nhập/đăng ký (dùng client từ shared/api)
│ │ ├── model/ # Hooks (useAuth), State, Types và logic kiểm tra quyền
│ │ ├── ui/ # LoginForm.tsx, UserAvatar.tsx (Component gắn với nghiệp vụ Auth)
│ │ └── index.ts # [CỔNG PUBLIC API] Chỉ export những gì cho phép bên ngoài dùng
│ │
│ ├── realtime/ # (Chuyển thư mục realtime/ ở gốc vào đây)
│ │ ├── api/ # Quản lý kênh sự kiện, lắng nghe message của nghiệp vụ
│ │ ├── model/ # Hooks (useRealtimeStream), xử lý dữ liệu thời gian thực
│ │ ├── ui/ # LiveStatusBadge.tsx, NotificationToast.tsx
│ │ └── index.ts # [CỔNG PUBLIC API]
│ │
│ └── ... # Các nghiệp vụ khác của dự án
│
└── shared/ # [TẦNG 3: NỀN TẢNG DÙNG CHUNG - VÔ TRI VỀ NGHIỆP VỤ]
├── api/ # (Từ api/ cũ) Cấu hình Axios/Fetch gốc, Interceptors, Socket client gốc
├── assets/ # (Từ assets/ cũ) Hình ảnh, fonts, icons tĩnh
├── config/ # Gom các cấu hình tĩnh toàn cục:
│ ├── env.ts # (Từ config.ts cũ) Biến môi trường
│ ├── strings.ts # (Từ strings.ts cũ) Hằng số văn bản / đa ngôn ngữ
│ └── theme.ts # (Từ theme.ts cũ) Cấu hình màu sắc, kích thước chuẩn
├── ui/ # (Từ components/ cũ) CHỈ chứa UI nguyên bản: Button, Input, Modal, Table
└── utils/ # (Từ utils/ cũ) Hàm thuần túy: format ngày tháng, tiền tệ, xử lý chuỗi
