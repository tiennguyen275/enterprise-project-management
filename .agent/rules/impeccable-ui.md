---
description: Impeccable UI/UX Design Rules & Anti-Slop Linter (inspired by pbakaus/impeccable)
globs: ["frontend/src/**/*.jsx", "frontend/src/**/*.scss", "backend/**/*.cs"]
---

# Impeccable UI & Clean Code Rules

Khi thiết kế, chỉnh sửa hoặc tạo mới bất kỳ mã nguồn nào trong dự án **Enterprise Project Management**, bắt buộc tuân thủ các quy chuẩn sau:

1. **`typeset` (Kiểu chữ & Độ tương phản):**
   - Mọi thẻ tiêu đề (`h1`, `h2`, `h3`, `h4`) và số liệu KPI phải có màu `#0f172a` (Slate 900) trên nền sáng, tuyệt đối không để chữ trắng hoặc xám nhạt gây mờ.
   - Sử dụng `letter-spacing: -0.02em` cho tiêu đề lớn và `tabular-nums` (`font-variant-numeric: tabular-nums`) cho các con số thống kê, phần trăm tiến độ và ngày tháng.

2. **`bolder` & `colorize` (Chống giao diện nhạt nhòa):**
   - Không tạo các thẻ trắng phẳng lì đơn điệu. Sử dụng dải viền nhấn bên trái (`border-left: 3.5px solid ...`) theo ngữ nghĩa (Priority / Status) hoặc dải viền trên cho các cột Kanban và thẻ KPI.
   - Các mã công việc (`PRJ-1`) dùng font monospace hoặc badge bo góc sắc nét với nền `#eff6ff` và chữ `#2563eb`.

3. **`delight` & `animate` (Chuyển động & Vi tương tác):**
   - Sử dụng đường cong chuyển động tự nhiên `cubic-bezier(0.22, 1, 0.36, 1)`.
   - Các thẻ có thể tương tác phải có hiệu ứng `:hover` nâng nhẹ `translateY(-2px)` và đổi màu viền sang `#93c5fd`.

4. **`harden` (Chống vỡ giao diện & Tuân thủ chuẩn CSS/Linter):**
   - Khi dùng `-webkit-line-clamp`, luôn khai báo kèm thuộc tính chuẩn `line-clamp` ngay bên dưới để tương thích trình duyệt và không gây cảnh báo CSS.
   - Mọi danh sách (Dự án, Kanban, Biên bản họp, Thảo luận, My Tasks) phải có trạng thái `Empty State` rõ ràng khi chưa có dữ liệu.
   - Mọi ô `input`, `select`, `textarea` phải khóa `background: #ffffff !important` và `color: #0f172a !important` kèm xử lý `:-webkit-autofill`.

5. **Kiến trúc SCSS Module Hóa:**
   - Tuyệt đối không viết CSS inline tràn lan hoặc tạo file `.css` rời rạc. Mọi style phải đặt đúng module trong `frontend/src/assets/styles/` và sử dụng biến từ `_variables.scss`.

6. **Quy chuẩn Comment (Chống AI Slop Comments):**
   - Tuyệt đối không viết các dòng comment trang trí màu mè (`// ==========`, `/* ---------- */`), không dùng từ ngữ sáo rỗng, và không comment giải thích lại những dòng code đã tự biểu đạt rõ nghĩa.
   - Chỉ giữ lại những ghi chú ngắn gọn, súc tích tại các vị trí có nghiệp vụ đặc thù, công thức tính toán hoặc lý do kỹ thuật cần lưu ý.
