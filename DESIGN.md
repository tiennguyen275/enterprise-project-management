# ENTERPRISE PROJECT MANAGEMENT SYSTEM (EPMS) — DESIGN SYSTEM & IMPECCABLE UI RULES

> Tài liệu này được xây dựng theo bộ khung kỹ năng **[pbakaus/impeccable](https://github.com/pbakaus/impeccable)** (`document`, `typeset`, `layout`, `bolder`, `delight`, `harden`, `audit`) nhằm định hình ngôn ngữ thiết kế chuẩn doanh nghiệp (Enterprise SaaS), chống lại sự đơn điệu rập khuôn ("AI Slop") và đảm bảo mọi thành phần giao diện mới luôn đồng bộ, sắc nét và có chiều sâu thị giác.

---

## 1. Triết lý Thiết kế Cốt lõi (Design Philosophy & Anti-Slop Rules)

1. **High-Contrast Editorial Clarity (`typeset`):**
   - **Cấm tuyệt đối** chữ xám nhạt trên nền xám hoặc chữ trắng trên nền sáng.
   - Mọi tiêu đề (`h1`, `h2`, `h3`, `h4`) bắt buộc sử dụng màu `#0f172a` (Slate 900) với `letter-spacing: -0.02em` và `font-weight: 700–800`.
   - Phân cấp thông tin rõ ràng bằng độ đậm nhạt, kích thước và khoảng cách thay vì lạm dụng quá nhiều hộp viền (nested boxes).

2. **Intentional Color & Semantic Accents (`colorize` & `bolder`):**
   - Không dùng các dải gradient tím/hồng chung chung của AI.
   - Sử dụng hệ màu **Enterprise Royal Blue (`#2563eb`)** kết hợp nền **Cool Alabaster (`#f8fafc`)** và bề mặt thẻ **Pure White (`#ffffff`)**.
   - Mỗi thẻ công việc (Task Card), thẻ KPI hoặc cảnh báo phải có **dải nhấn ngữ nghĩa (Semantic Left Accent Border 3px–4px)** biểu thị mức độ ưu tiên hoặc trạng thái sức khỏe.

3. **Tactile Micro-Interactions (`delight` & `animate`):**
   - Mọi tương tác (hover thẻ dự án, kéo thả Kanban, bấm nút, chuyển tab) sử dụng đường cong vật lý mượt mà: `cubic-bezier(0.22, 1, 0.36, 1)`.
   - Thẻ có thể nhấp (Clickable Cards) khi `:hover` sẽ nâng nhẹ `translateY(-2px)` kèm bóng đổ đa tầng (Multi-layered ambient shadow) và viền chuyển sang sắc xanh `#93c5fd`.

4. **UI Hardening & Edge Cases (`harden`):**
   - Chuỗi tiếng Việt dài trên tiêu đề dự án hoặc mô tả công việc phải được xử lý bằng `-webkit-line-clamp` hoặc `text-overflow: ellipsis` để không bao giờ làm vỡ khung lưới (Grid/Flexbox).
   - Các bảng dữ liệu, danh sách bình luận và cột Kanban phải xử lý tốt trạng thái **Empty State** (có biểu tượng trực quan, thông điệp rõ ràng và nút kêu gọi hành động - CTA).
   - Các ô nhập liệu (Input/Select) luôn khóa nền `#ffffff` và chữ `#0f172a`, chống lại lỗi trình duyệt tự đổi nền đen khi Autofill.

---

## 2. Hệ thống Design Tokens (`_variables.scss`)

### 2.1. Bảng màu (Color Palette)

| Token | Mã Hex | Mục đích sử dụng |
| :--- | :--- | :--- |
| `$primary` | `#2563eb` | Nút hành động chính, liên kết, trạng thái đang chọn (Active Tab) |
| `$primary-hover` | `#1d4ed8` | Trạng thái `:hover` của nút chính |
| `$primary-light` | `#eff6ff` | Nền badge mã dự án, nền tab đang kích hoạt |
| `$bg-body` | `#f8fafc` | Nền tổng thể của toàn bộ không gian làm việc |
| `$bg-surface` | `#ffffff` | Bề mặt thẻ Card, Modal, Navbar, Bảng dữ liệu |
| `$text-title` | `#0f172a` | Tiêu đề chính, tên dự án, tên công việc, con số KPI |
| `$text-body` | `#334155` | Nội dung văn bản chính, bình luận, biên bản họp |
| `$text-muted` | `#64748b` | Nhãn phụ, ngày tháng, chú thích |
| `$success` | `#10b981` | Trạng thái Hoàn thành (Done), Đúng tiến độ (On Track) |
| `$warning` | `#f59e0b` | Trạng thái Chờ duyệt (In Review), Có rủi ro (At Risk), Hạn hôm nay |
| `$danger` | `#ef4444` | Cảnh báo Quá hạn (Overdue), Khẩn cấp (Urgent), Xóa |

### 2.2. Thang đo Kiểu chữ (Typography Scale - `typeset`)

| Cấp độ | Kích thước | Độ đậm | Khoảng cách chữ | Ứng dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Display / H1** | `1.75rem` (28px) | `800` | `-0.025em` | Tiêu đề trang lớn (Không Gian Làm Việc, My Tasks) |
| **Title / H2** | `1.375rem` (22px) | `800` | `-0.02em` | Tên dự án ở Header, tiêu đề Modal |
| **Section / H3** | `1.125rem` (18px) | `700` | `-0.01em` | Tiêu đề thẻ dự án, tiêu đề khối Analytics |
| **Card Title / H4** | `0.9375rem` (15px) | `700` | `0` | Tên công việc trên thẻ Kanban |
| **Body** | `0.875rem` (14px) | `400–500` | `0` | Mô tả công việc, nội dung bình luận |
| **Caption / Badge** | `0.75rem` (12px) | `700` | `0.04em` | Mã Task (`PRJ-1`), nhãn độ ưu tiên, bộ đếm |

### 2.3. Nhịp điệu Không gian & Bóng đổ (`layout`)

- **Hệ lưới chuẩn (Spatial Grid):** Bội số của `4px` và `8px` (`0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`).
- **Độ bo góc (Border Radius):**
  - `$radius-sm`: `6px` (Badges, nút nhỏ, ô chọn trạng thái).
  - `$radius-md`: `8px` (Inputs, Buttons, Kanban Task Cards).
  - `$radius-lg`: `12px` (Project Cards, Kanban Columns, Analytics Panels).
- **Bóng đổ đa tầng (Multi-layered Shadows):**
  - `$shadow-xs`: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`
  - `$shadow-sm`: `0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`
  - `$shadow-md`: `0 10px 15px -3px rgba(15, 23, 42, 0.07), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`
  - `$shadow-modal`: `0 25px 50px -12px rgba(15, 23, 42, 0.22)`

---

## 3. Cấu trúc Kiến trúc SCSS Module Hóa (`src/assets/styles/`)

```text
frontend/src/assets/styles/
├── _variables.scss      # Design Tokens, Colors, Shadows, Easing curves
├── _reset.scss          # Reset chuẩn hóa, khóa độ tương phản tiêu đề, scrollbar tinh gọn
├── _components.scss     # Buttons, Inputs, Badges, Modals, Empty/Loading states
├── _auth.scss           # Trang Đăng nhập & Đăng ký
├── _dashboard.scss      # Navbar toàn cục & Không gian danh sách dự án
├── _kanban.scss         # Bảng Kanban kéo thả, Priority left-stripe cards
├── _meeting_notes.scss  # Biên bản cuộc họp & Action items
├── _analytics.scss      # Thống kê KPI & Phân bổ tải thành viên
├── _discussion.scss     # Modal chi tiết công việc & Luồng bình luận
├── _my_tasks.scss       # Không gian làm việc cá nhân (My Tasks)
└── main.scss            # Điểm nhập trung tâm (Entry point)
```

---

## 4. Checklist Kiểm định Chất lượng Giao diện (`audit` & `critique`)

Trước khi hoàn thành bất kỳ tính năng Frontend nào, AI Agent bắt buộc kiểm tra qua 6 tiêu chí sau:

- [ ] **Contrast Check:** Tiêu đề và số liệu có sử dụng `#0f172a` rõ nét trên nền sáng không?
- [ ] **Visual Hierarchy:** Nhìn vào màn hình trong 2 giây đầu tiên có phân biệt được ngay vùng thông tin chính (KPI / Kanban) và hành động chính (Primary CTA) không?
- [ ] **Semantic Accents:** Các thẻ công việc có dải màu phân biệt mức độ ưu tiên (Thấp / Trung bình / Cao / Khẩn cấp) chưa?
- [ ] **Overflow Hardening:** Nếu tên dự án hoặc tiêu đề công việc dài 120 ký tự, bố cục có bị vỡ hay đã có `line-clamp`?
- [ ] **Interactive Polish:** Các nút bấm, thẻ card và ô nhập liệu đã có hiệu ứng `:hover` và `:focus-visible` mượt mà chưa?
- [ ] **Zero-State Readiness:** Khi danh sách rỗng, giao diện có hiển thị khung Empty State thân thiện kèm hướng dẫn không?

