---
description: Quy tắc đồng bộ tài liệu Thuyết trình & Báo cáo khi phát triển tính năng mới
globs: "**/*"
---

# Quy tắc đồng bộ tài liệu Thuyết trình & Báo cáo (Sync Presentation Docs)

Mỗi khi hoàn thành phát triển một tính năng, module, hoặc cấu trúc mới trong dự án `EnterpriseProjectManagement`:

1. **Tài liệu cần cập nhật:**
   - [`docs/HUONG_DAN_THUYET_TRINH_VA_PHAN_BIEN.md`](file:///e:/EnterpriseProjectManagement/docs/HUONG_DAN_THUYET_TRINH_VA_PHAN_BIEN.md)
   - [`docs/ARCHITECTURE_AND_DESIGN_PATTERNS.md`](file:///e:/EnterpriseProjectManagement/docs/ARCHITECTURE_AND_DESIGN_PATTERNS.md)

2. **Các mục bắt buộc cập nhật khi có tính năng mới:**
   - **Kịch bản Demo:** Bổ sung bước demo tính năng mới theo thứ tự hợp lý trong User Journey.
   - **Tầng kiến trúc Clean Architecture:** Liệt kê các file mới sinh ra thuộc tầng nào (`Domain`, `Application`, `Infrastructure`, `Api`, `Frontend`).
   - **Áp dụng SOLID & Design Patterns:** Chỉ ra tính năng mới này đã kế thừa `BaseEntity`, `IRepository`, `IUnitOfWork` hay pattern nào.
   - **Câu hỏi phản biện (FAQ):** Bổ sung ít nhất 1-2 câu hỏi mà Hội đồng / Giám khảo có thể sẽ xoáy sâu vào tính năng mới đó kèm câu trả lời mẫu trọn vẹn.
