# Enterprise Project Management System (EPMS Enterprise v2026)

Hệ thống Quản lý, Điều phối Dự án & Cộng tác Doanh nghiệp theo mô hình **Clean Architecture (.NET 10)** kết hợp **React + Vite + Modular SCSS** và **SignalR Realtime**.

---

## Tính năng cốt lõi

- **Xác thực & Phân quyền 2 tầng (Two-Tier RBAC)**:
  - Đăng nhập / Đăng ký, Google OAuth, Quên mật khẩu qua OTP, Ghi nhớ email.
  - **Tầng hệ thống (`SystemRole`: `Admin` / `User`)**: Ban Giám đốc / Admin có tầm nhìn toàn cảnh mọi dự án doanh nghiệp và quản trị nhân sự; nhân viên thường chỉ truy cập các dự án tham gia.
  - **Tầng dự án (`ProjectRole`)**: `Owner`, `ProjectManager`, `Member`, `Viewer`.
- **Danh bạ Nhân sự (`/users`), Hồ sơ Cá nhân (`/profile`) & Avatar đồng bộ**:
  - Quản lý danh sách nhân sự, cấp/hạ quyền Admin, khóa/mở tài khoản.
  - Tự cập nhật họ tên, tải ảnh đại diện (tự nén 200×200px), chọn bộ avatar doanh nghiệp hoặc dán URL; hiển thị đồng bộ trên Navbar, cụm Avatar xếp chồng ở Dashboard, thẻ Kanban, dropdown chọn người thực hiện (`AssigneeSelect`), bình luận và Audit Log.
- **Tìm kiếm Toàn cục (`Ctrl + K`) & Tiếng Việt không dấu**:
  - Header 3 cột Glassmorphism với thanh Spotlight Search trung tâm, hỗ trợ tìm không dấu (`dien may lanh`, `gia bao`), lọc theo 3 nhóm (**Dự án, Công việc, Nhân sự**), điều hướng bàn phím (`↑ ↓ Enter Esc`) và mở thẳng chi tiết công việc.
- **Không gian Dự án 6 phân hệ**:
  1. **Bảng Kanban kéo thả** & **Modal Chi tiết Công việc 2 cột ngang** (Subtasks/WBS, Time Tracking, Bình luận, AI gợi ý người nhận việc & việc con).
  2. **Tiến độ & Đường găng (CPM Gantt)**: Thuật toán 2 lượt Forward/Backward Pass, phát hiện chu trình (DFS Cycle Detection) và biểu đồ Gantt trực quan.
  3. **Phòng Trao đổi Realtime & Trợ lý AI Gemini**: SignalR chat trực tuyến kèm lệnh `@ai` phân tích tiến độ/rủi ro.
  4. **Báo cáo Sức khỏe Dự án (R/A/G Health Check)**: Chẩn đoán sức khỏe tự động và lưu snapshot định kỳ.
  5. **Biên bản Cuộc họp (Meeting Notes)**: Ghi nhận quyết định và hạng mục hành động.
  6. **Phân tích Phân bổ (Analytics), Xuất Báo cáo Excel/PDF & Nhật ký Hoạt động (Audit Log)**: Xuất `.csv` UTF-8 BOM (chống CSV Formula Injection), in báo cáo tổng hợp PDF và dòng thời gian lịch sử thao tác.
- **Chuông Thông báo Realtime (SignalR)**: Nhận thông báo tức thì khi được giao việc, có bình luận mới hoặc được mời vào dự án.

---

## Công nghệ sử dụng

- **Backend**: ASP.NET Core Web API (.NET 10), Entity Framework Core, SignalR, JWT, BCrypt, xUnit
- **Frontend**: React 19, Vite (Code Splitting + Lazy Loading), Modular SCSS, Material UI Icons, SignalR Client
- **Database**: Microsoft SQL Server
- **Containerization**: Docker & Docker Compose

---

## Cấu trúc thư mục

```text
├── backend/
│   ├── EnterpriseProjectManagement.Domain          # Entities, Enums, BaseEntity
│   ├── EnterpriseProjectManagement.Application     # Feature Slices (DTOs, Services, Interfaces)
│   ├── EnterpriseProjectManagement.Infrastructure  # EF Core DbContext, Repositories, JWT, AI, OTP
│   ├── EnterpriseProjectManagement.Api             # Controllers, SignalR Hubs, Program.cs
│   ├── EnterpriseProjectManagement.Tests           # xUnit Automated Unit Tests
│   └── EnterpriseProjectManagement.slnx
├── frontend/
│   └── src/
│       ├── assets/styles/{base,components,features}/ # Modular SCSS theo từng phân hệ
│       ├── components/{common,layout,auth,projects}/ # Reusable UI, Shell & Project Tab Components
│       ├── pages/{auth,projects,tasks,users}/        # Lazy-loaded Route Pages
│       ├── context/                                  # AuthContext
│       ├── services/                                 # Axios API & SignalR Client
│       └── utils/                                    # Vietnamese Search & Excel/PDF Export
├── docs/                                           # Tài liệu Kiến trúc & Design Patterns
├── tools/                                          # Review Gates & Verification Scripts
└── docker-compose.yml
```

---

## Khởi chạy & Kiểm thử

### 1. Chạy Backend API (`http://localhost:5164`)
```bash
dotnet run --project backend/EnterpriseProjectManagement.Api/EnterpriseProjectManagement.Api.csproj --launch-profile http
```

### 2. Chạy Frontend (`http://localhost:5173`)
```bash
cd frontend
npm install
npm run dev
```

### 3. Chạy Kiểm thử Tự động & Build
```bash
dotnet test backend/EnterpriseProjectManagement.Tests/EnterpriseProjectManagement.Tests.csproj
npx --prefix frontend oxlint
npm --prefix frontend run build
```

---

## Tài khoản Demo mẫu

*(Mật khẩu chung cho các tài khoản nhân viên demo: `Demo@2026`)*

| Họ và tên | Email | Vai trò |
| :--- | :--- | :--- |
| **Trần Minh Quân** | `quan.pm@epms-demo.vn` | Project Manager |
| **Nguyễn Thảo Vy** | `vy.ba@epms-demo.vn` | Business Analyst |
| **Lê Hoàng Nam** | `nam.be@epms-demo.vn` | Senior Backend Dev |
| **Phạm Thu Hà** | `ha.fe@epms-demo.vn` | Frontend Engineer |
| **Đỗ Gia Bảo** | `bao.qa@epms-demo.vn` | QA Engineer |
