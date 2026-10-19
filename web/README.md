# Moonkage web

React 19 + TypeScript + Vite. Giao diện theo design system "DS: Moonkage" (`src/styles/tokens.css`, `src/styles/components.css`, class `mk-*`).

## Chạy

```bash
cp .env.example .env.local   # sửa VITE_API_BASE_URL nếu gateway không ở localhost:8080
npm install
npm run dev                  # http://localhost:5173 (đã có trong CORS_ORIGINS của gateway)
```

Thiếu `VITE_API_BASE_URL` thì app dừng ở màn lỗi cấu hình.

## Kiểm tra trước khi commit

```bash
npm run lint
npm test
npm run build
```

## Cấu trúc `src/`

| Thư mục / file | Nội dung |
| --- | --- |
| `config.ts` | Đọc biến `VITE_*` |
| `strings.ts` | Mọi câu chữ hiển thị |
| `routes.ts` | Đường dẫn các trang |
| `api/` | axios client (gắn Bearer, 401 → đăng xuất, `ApiError`), endpoint, gọi identity-service |
| `auth/` | `AuthProvider`, `useAuth`, `RequireAuth` |
| `realtime/` | Kết nối STOMP tới orchestrator-service (gateway `/ws`, token trong CONNECT), `useRealtime().subscribe` |
| `features/nfc/` | Xác minh CCCD (FR-04): `useNfcSession`, panel QR, thẻ trạng thái |
| `pages/` | Trang gắn vào router |
| `styles/` | Token và component của DS (chép từ DS, không sửa tay), `app.css` cho bố cục |
