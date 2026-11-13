# Sơ đồ UML

Bộ sơ đồ UML của Moonkage, vẽ bằng Mermaid để GitHub hiển thị thẳng và để chép sang slide. Mọi sơ đồ bám theo code trên `develop` (ngày 09/11/2026). Mỗi file ghi rõ class hoặc file nguồn để đối chiếu khi code đổi.

| Sơ đồ | File | Nguồn đối chiếu |
|---|---|---|
| Use Case | [use-case.md](use-case.md) | [requirements.md](../../product/requirements.md) mục 3 và 5, controller của từng service |
| Class (mô hình miền) | [class-diagram.md](class-diagram.md) | Entity JPA của từng service |
| State Machine | [state-machines.md](state-machines.md) | Enum `*Status` và các method đổi trạng thái |
| Activity | [activity-diagrams.md](activity-diagrams.md) | Service xử lý luồng F1, F2/F3, F4, F5 |
| Sequence | [software-design.md](../software-design.md) mục 7 | Đã có từ trước, không chép lại ở đây |

## Quy ước

- Tên tác nhân, use case và trạng thái dùng tiếng Việt như trên giao diện. Mã trạng thái trong code ghi kèm trong ngoặc để tra.
- Phần **chưa làm** vẽ bằng nét đứt và ghi "(chưa làm)", để không trình bày một tính năng chưa có như đã có.
- Code đổi thì sửa sơ đồ trong cùng PR, giống quy tắc của [api-db/](../api-db/README.md).

## Xuất ảnh cho slide

Dán khối `mermaid` vào [mermaid.live](https://mermaid.live), rồi chọn *Actions → PNG/SVG*. Hoặc dùng CLI:

```bash
npx -y @mermaid-js/mermaid-cli -i docs/architecture/uml/state-machines.md -o out.md
```

CLI tạo một ảnh SVG cho mỗi khối `mermaid` trong file.
