# Kịch Bản Demo Bảo Vệ Đồ Án Tốt Nghiệp (7 Phút) — EPMS Enterprise v2026

## 1. Chuẩn Bị Trước Khi Demo
- Khởi chạy Backend API (`http://localhost:5164`):
  ```bash
  dotnet run --project backend/EnterpriseProjectManagement.Api/EnterpriseProjectManagement.Api.csproj --launch-profile http
  ```
- Khởi chạy Frontend (`http://localhost:5173`):
  ```bash
  npm --prefix frontend run dev
  ```
- Tài khoản sử dụng:
  - **Admin (Ban Giám Đốc)**: `tienmn2001@gmail.com` (nhìn thấy toàn bộ dự án công ty, có quyền quản trị nhân sự).
  - **Nhân viên demo (Mật khẩu chung: `Demo@2026`)**: `quan.pm@epms-demo.vn` (PM), `nam.be@epms-demo.vn` (Backend Dev), `bao.qa@epms-demo.vn` (QA — có công việc quá hạn để minh họa cảnh báo).

---

## 2. Kịch Bản Trình Diễn Từng Bước (7 Phút)

### Phút 0:00 – 1:00 | Xác thực & Tổng quan Doanh nghiệp (Góc nhìn Admin)
1. Mở trang **Đăng nhập (`/login`)**: giới thiệu ghi nhớ email, Google OAuth và luồng Quên mật khẩu qua OTP.
2. Đăng nhập bằng tài khoản **Admin (`tienmn2001@gmail.com`)**:
   - Chỉ vào **Header 3 cột Glassmorphism**: nhãn `ADMIN`, Avatar cá nhân, Chuông thông báo Realtime và thanh Spotlight Search (`Ctrl + K`).
   - Chỉ vào **Dashboard**: 4 thẻ KPI tổng quan, thanh tìm kiếm không dấu, bộ lọc trạng thái, sắp xếp và **cụm Avatar thành viên xếp chồng** trên từng thẻ dự án.

### Phút 1:00 – 2:00 | Phân Quyền 2 Tầng (RBAC) & Quản Trị Nhân Sự
1. Bấm tab **Nhân sự (`/users`)**: cho Hội đồng thấy danh bạ 9 nhân sự kèm ảnh đại diện, số dự án/công việc và nút **Cấp/Hạ quyền Admin**, **Khóa/Mở tài khoản**.
2. Bấm vào **Avatar góc phải → Hồ sơ cá nhân (`/profile`)**: minh họa đổi tên hiển thị / ảnh đại diện cập nhật tức thì lên Navbar.
3. Mở **Tìm kiếm toàn cục (`Ctrl + K`)**: gõ không dấu `gia bao` → chọn 1 công việc để nhảy thẳng vào đúng dự án và tự động mở Modal chi tiết công việc đó.

### Phút 2:00 – 4:00 | Điều Phối Dự Án: Kanban, Modal 2 Cột & Đính Kèm Tệp
1. Mở dự án **`ERP-FIN-26` (Triển khai Hệ thống ERP Tài chính Q4)**:
   - **Bảng Kanban**: lọc theo người thực hiện (dropdown có Avatar), kéo thả 1 công việc giữa các cột để minh họa **SignalR Realtime**.
   - **Modal Chi tiết Công việc (2 cột ngang)**:
     - Cột trái: Mô tả, **Subtasks / WBS** (có nút *Gợi ý việc con bằng AI*), **Tệp đính kèm** (Upload/Download file PDF/Ảnh/Excel tối đa 10 MB), **Bình luận**.
     - Cột phải: Trạng thái, Độ ưu tiên, **AssigneeSelect có Avatar** + *Gợi ý người nhận việc bằng AI*, Time Tracking (Giờ thực tế / Ước lượng).
   - Bấm nút **Cài đặt** & **Mời Thành Viên** để minh họa đầy đủ CRUD dự án và thêm/gỡ thành viên.

### Phút 4:00 – 5:30 | Điểm Nhấn Kỹ Thuật: Đường Găng CPM Gantt & Trợ Lý AI
1. Chuyển tab **Tiến Độ & Đường Găng (CPM)**:
   - Giải thích thuật toán 2 lượt (Forward/Backward Pass) tính `ES/EF`, `LS/LF`, `Total Float = 0` (Đường găng màu đỏ) và cơ chế **DFS Cycle Detection** chặn tạo vòng lặp phụ thuộc.
2. Chuyển tab **Trao Đổi & Trợ Lý AI**:
   - Bấm chip **`@ai Tóm tắt tiến độ`** để Gemini phân tích trực tiếp dữ liệu dự án theo thời gian thực qua SignalR.

### Phút 5:30 – 7:00 | Báo Cáo Sức Khỏe, Xuất Excel/PDF, Audit Log & Chứng Minh Bảo Mật
1. Chuyển tab **Báo Cáo Sức Khỏe (R/A/G)** và **Biên Bản Cuộc Họp**.
2. Chuyển tab **Báo Cáo Phân Bổ (Analytics)**:
   - Bấm **Xuất Excel Công việc (`.csv`)** / **In Báo cáo PDF** và kéo xuống xem **Nhật Ký Hoạt Động Dự Án (Audit Log)**.
3. *(Chốt điểm bảo mật)* Đăng nhập nhanh bằng tài khoản nhân viên thường **`nam.be@epms-demo.vn`** (`Demo@2026`):
   - Chứng minh nhân viên thường chỉ nhìn thấy đúng dự án mình tham gia, mở **Chuông Thông báo Realtime** xem thông báo giao việc mới và vào **Công việc của tôi (`My Tasks`)**.
