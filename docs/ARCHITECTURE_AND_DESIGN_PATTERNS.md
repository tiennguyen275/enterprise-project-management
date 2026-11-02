# KIẾN TRÚC HỆ THỐNG VÀ NGUYÊN LÝ THIẾT KẾ (SOLID & DESIGN PATTERNS)

Tài liệu này được biên soạn dành cho bạn đọc hiểu tường tận toàn bộ kiến trúc dự án để tự tin báo cáo và phản biện trước hội đồng chấm đồ án tốt nghiệp.

---

## 1. Tổng quan Kiến trúc: Clean Architecture (Onion Architecture)

Hệ thống được chia thành 4 tầng riêng biệt từ trong ra ngoài:

```text
[ Domain ] ◄── [ Application ] ◄── [ Infrastructure ]
     ▲                  ▲                    ▲
     │                  │                    │
     └──────────────────┴────────────── [ API ]
```

1. **Domain (Lõi trung tâm):** 
   - Chứa các thực thể cốt lõi (`Entities`), `Enums`, không phụ thuộc vào bất kỳ thư viện bên ngoài nào (kể cả EF Core hay Database).
   - Tệp chính: `User.cs`, `Project.cs`, `ProjectTask.cs`, `ProjectMember.cs`, `TaskComment.cs`.
2. **Application (Tầng xử lý logic nghiệp vụ):**
   - Chứa Interfaces (`IRepository`, `IUnitOfWork`), DTOs, Business Rules.
   - Không quan tâm dữ liệu lưu ở SQL Server hay Postgres.
3. **Infrastructure (Hạ tầng công nghệ):**
   - Triển khai cụ thể các Interface của Application: EF Core `DbContext`, gọi Database, gửi Email, v.v.
4. **Api (Tầng giao tiếp bên ngoài):**
   - Controllers RESTful API, Middleware, Authentication JWT.
5. **Frontend (ReactJS thuần):**
   - Giao diện SPA (Single Page Application) gọi API qua HTTP/JSON.

---

## 2. Ứng dụng các nguyên lý SOLID trong Code

Khi thầy cô hỏi: *"Em đã áp dụng SOLID như thế nào trong dự án?"*, bạn trả lời theo 5 điểm này:

### S – Single Responsibility Principle (Nguyên tắc đơn trách nhiệm)
- Mỗi class chỉ đảm nhận đúng **một nhiệm vụ duy nhất**:
  - `ProjectTask.cs`: Chỉ mang thông tin thực thể công việc.
  - `IRepository<T>`: Chỉ chịu trách nhiệm về các thao tác dữ liệu (CRUD).
  - `IUnitOfWork`: Chỉ chịu trách nhiệm về transaction (commit dữ liệu).

### O – Open/Closed Principle (Nguyên tắc Đóng / Mở)
- Hệ thống mở để mở rộng nhưng đóng để chỉnh sửa:
  - Tất cả Entity kế thừa từ `BaseEntity` (có sẵn `Id`, `CreatedAt`, `IsDeleted` để xóa mềm - Soft Delete).
  - Khi cần thêm Entity mới (ví dụ `Milestone` hay `Attachment`), chỉ cần kế thừa `BaseEntity` mà không cần sửa đổi mã nguồn cũ.

### L – Liskov Substitution Principle (Nguyên tắc thay thế Liskov)
- Mọi Entity con (`Project`, `ProjectTask`, `User`) đều có thể thay thế hoàn toàn cho lớp cha `BaseEntity` mà không làm thay đổi tính đúng đắn của logic trong `IRepository<T>`.

### I – Interface Segregation Principle (Nguyên tắc phân tách Interface)
- Không tạo một Interface khổng lồ "ôm đồm" tất cả mọi thứ:
  - `IRepository<T>`: Chỉ chứa các thao tác CRUD cơ bản.
  - `IUnitOfWork`: Chỉ quản lý SaveChanges / Transaction.

### D – Dependency Inversion Principle (Nguyên tắc đảo ngược phụ thuộc)
- **Tầng cao không phụ thuộc tầng thấp, cả hai cùng phụ thuộc vào Interface (Abstraction):**
  - Tầng `Application` và `Controllers` không gọi trực tiếp Database hay EF Core, mà gọi qua Interface `IRepository<Project>` và `IUnitOfWork`.
  - Nhờ vậy, sau này muốn đổi từ SQL Server sang PostgreSQL hay Mock Data để viết Unit Test đều không cần sửa một dòng code nào trong `Application`.

---

## 3. Các Design Patterns được áp dụng

| Design Pattern | Loại Pattern | Nơi áp dụng trong dự án | Mục đích |
| :--- | :--- | :--- | :--- |
| **Repository Pattern** | Architectural / Structural | `IRepository<T>` | Tách biệt hoàn toàn tầng lưu trữ dữ liệu (DB) khỏi tầng nghiệp vụ (Business logic). |
| **Unit of Work Pattern** | Behavioral | `IUnitOfWork` | Đảm bảo nhiều thao tác thêm/sửa/xóa diễn ra trong cùng 1 Transaction (hoặc cùng thành công, hoặc rollback nếu có lỗi). |
| **Dependency Injection (DI)** | Creational | `Program.cs` (.NET Core DI container) | Tự động tiêm (inject) các Service/Repository vào Controller, giảm sự phụ thuộc cứng (tight coupling). |
| **Soft Delete Pattern** | Data Pattern | `IsDeleted` trong `BaseEntity` | Không xóa vĩnh viễn dòng trong database, tránh mất dữ liệu liên kết và phục vụ truy vết lịch sử doanh nghiệp. |

---

## 4. Mô hình Dữ liệu (Domain Entities) cốt lõi

1. **User**: Quản lý tài khoản, thông tin cá nhân, vai trò.
2. **Project**: Dự án, mã dự án (`Code`), ngày bắt đầu/kết thúc, trạng thái.
3. **ProjectMember**: Bảng liên kết nhiều - nhiều giữa `User` và `Project`, gắn kèm vai trò (`Owner`, `ProjectManager`, `Member`, `Viewer`).
4. **ProjectTask**: Công việc cụ thể:
   - `TaskCode`: Mã task sinh tự động (kế thừa từ bài toán thực tế của Talgent, ví dụ: `PRJ-101`).
   - Phân cấp `ParentTaskId` và `SubTasks` (Task cha và danh sách Task con).
   - Tiến độ (`Todo`, `InProgress`, `InReview`, `Done`, `Blocked`).
   - Độ ưu tiên (`Low`, `Medium`, `High`, `Urgent`).
5. **TaskComment**: Bình luận, thảo luận trực tiếp trên từng Task.



---

## 5. Quy Trình Phân Nhánh Git (Git Flow Workflow)

Dự án áp dụng quy chuẩn Git Flow để theo dõi tiến trình và quản lý lịch sử commit minh bạch:

```text
main (hoặc master)  ──────────────────────────────────────────● (Bản phát hành ổn định)
                      ▲                                      ▲
                      │                                      │ merge khi hoàn tất release
dev                   ●──────────●──────────●────────────────● (Nhánh phát triển tích hợp)
                                  ▲          ▲
                     feature/...  ●──────────┘ merge via PR/rebase
```

### Quy tắc làm việc:
1. **`main` (hoặc `master`)**: Nhánh sản phẩm hoàn thiện, chỉ merge khi tính năng đã được kiểm thử đầy đủ và sẵn sàng báo cáo/public.
2. **`dev`**: Nhánh trung tâm cho toàn bộ quá trình phát triển (development). Tất cả các tính năng hoàn thành sẽ được merge về đây.
3. **`feature/<tên-chức-năng>`**: Mỗi tính năng, module hoặc tầng kiến trúc sẽ tách thành 1 branch riêng từ `dev`:
   - Ví dụ: `feature/infrastructure-ef-core`, `feature/auth-jwt`, `feature/project-crud`, `feature/frontend-dashboard`...
   - Sau khi hoàn thành và test xong trên feature branch, sẽ merge về `dev`.


---

## 6. Chi tiết Tầng Hạ Tầng (Infrastructure) & Entity Framework Core

Tầng `Infrastructure` giải quyết các bài toán kỹ thuật cụ thể mà tầng `Domain` và `Application` không quan tâm:

### 1. Cấu hình DbContext (`ApplicationDbContext.cs`)
- **Global Query Filter (Soft Delete)**:
  ```csharp
  modelBuilder.Entity<ProjectTask>().HasQueryFilter(e => !e.IsDeleted);
  ```
  *Ý nghĩa:* Mọi câu lệnh LINQ như `_context.ProjectTasks.ToList()` đều tự động gắn thêm điều kiện `WHERE IsDeleted = 0`. Lập trình viên không lo vô tình lấy phải dữ liệu đã bị xóa.
- **Fluent API Relationships**:
  - `Project` 1 - N `ProjectMember` (Cascade Delete khi xóa hẳn project).
  - `User` 1 - N `ProjectMember` (Restrict Delete để tránh xóa nhầm user kéo theo mất dữ liệu lịch sử).
  - `ProjectTask` Self-referencing: Một task có thể trỏ tới `ParentTaskId` và chứa danh sách `SubTasks`.
  - `ChangeTracker Audit`: Tự động điền ngày giờ `UpdatedAt` khi bất kỳ entity nào bị cập nhật.

### 2. Triển khai Generic Repository (`Repository<T>`)
- Tách biệt logic truy xuất Entity Framework:
  - `GetByIdAsync`, `GetAllAsync`, `FindAsync` (dùng `AsNoTracking()` để tăng tốc độ truy vấn chỉ đọc).
  - `DeleteAsync`: Thực hiện Soft Delete (`entity.IsDeleted = true`).

### 3. Dependency Injection mở rộng (`DependencyInjection.cs`)
- Đăng ký `AddInfrastructureServices` gọn gàng:
  - `services.AddScoped(typeof(IRepository<>), typeof(Repository<>));`
  - `services.AddScoped<IUnitOfWork, UnitOfWork>();`
  - Controller hoặc Service chỉ cần tiêm `IRepository<ProjectTask>` qua Constructor.


---

## 7. Chi tiết Phân Hệ Xác Thực & Phân Quyền (Auth & JWT)

Được triển khai trên nhánh `feature/auth-jwt` và tích hợp vào `dev`:

### 1. Luồng hoạt động (Workflow):
1. **Đăng ký (`POST /api/auth/register`)**:
   - Nhận `RegisterRequestDto(Email, Password, FullName)`.
   - Kiểm tra Email có bị trùng hay không qua `_userRepository.FindAsync(...)`.
   - Băm mật khẩu bằng thuật toán công nghiệp **BCrypt** (`BCrypt.Net.BCrypt.HashPassword`). Tuyệt đối không lưu mật khẩu dạng plain text.
   - Lưu `User` vào Database và cấp phát ngay JWT Token.
2. **Đăng nhập (`POST /api/auth/login`)**:
   - Nhận `LoginRequestDto(Email, Password)`.
   - Tìm user theo Email, kiểm tra cờ `IsActive` (chặn tài khoản bị khóa).
   - Xác thực mật khẩu qua `BCrypt.Net.BCrypt.Verify`.
   - Cấp phát JWT Token có hạn sử dụng (7 ngày).

### 2. Cấu trúc JWT Token:
- **Header**: Thuật toán mã hóa `HmacSha256`.
- **Payload (Claims)**:
  - `sub`: UserId (dạng GUID).
  - `email`: Địa chỉ email người dùng.
  - `name`: Tên đầy đủ hiển thị.
  - `jti`: Mã định danh token ngẫu nhiên.
- **Middleware Authentication & Authorization**:
  - `builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)...`
  - Đảm bảo các Controller sau này chỉ cần gắn attribute `[Authorize]` là tự động bảo vệ endpoint, từ chối request không có hoặc sai Token (`401 Unauthorized`).


---

## 8. Chi tiết Phân Hệ Quản Lý Dự Án & Công Việc (Project & Task Management)

Được triển khai trên nhánh `feature/project-task-management`:

### 1. Phân hệ Dự án (`ProjectsController` & `ProjectService`)
- `GET /api/projects`: Lấy toàn bộ danh sách dự án mà người dùng hiện tại tham gia kèm tỷ lệ hoàn thành công việc (`TotalTasks`, `CompletedTasks`).
- `GET /api/projects/{id}`: Xem chi tiết dự án, danh sách thành viên và vai trò (`Owner`, `ProjectManager`, `Member`, `Viewer`).
- `POST /api/projects`: Tạo dự án mới, tự động gán người tạo làm `Owner`.
- `PUT /api/projects/{id}` & `DELETE /api/projects/{id}`: Cập nhật và xóa mềm (Soft Delete).
- `POST /api/projects/{id}/members`: Mời thêm thành viên vào dự án.

### 2. Phân hệ Công việc (`TasksController` & `TaskService`)
- `GET /api/tasks/project/{projectId}`: Lấy danh sách công việc của dự án theo dạng cây (Gốc và Subtasks).
- `POST /api/tasks`: 
  - **Tự động sinh mã Task (`TaskCode`)**: Dựa trên mã dự án (ví dụ `PRJ-1`, `PRJ-2`).
  - Hỗ trợ gán người phụ trách (`AssigneeId`), hạn hoàn thành (`DueDate`), số giờ ước lượng (`EstimatedHours`).
  - Hỗ trợ tạo Subtask bằng cách truyền `ParentTaskId`.
- `PUT /api/tasks/{id}`: Cập nhật trạng thái (`Todo`, `InProgress`, `InReview`, `Done`), độ ưu tiên (`Low`, `Medium`, `High`, `Urgent`), số giờ thực tế (`ActualHours`).
- `POST /api/tasks/{id}/comments`: Thảo luận trao đổi trực tiếp trên từng Task.
- **Bảo mật**: Mọi API đều yêu cầu Header `Authorization: Bearer <token>`, tự động lấy `UserId` từ Claims để phân quyền.


---

## 9. Chi tiết Giao Diện Người Dùng (Frontend ReactJS + Vite)

Được triển khai trên nhánh `feature/frontend-auth-and-dashboard`:

### 1. Kiến trúc Client SPA (Single Page Application)
- **Công nghệ**: ReactJS thuần (JavaScript JSX, không dùng TypeScript giúp mã nguồn nhẹ và dễ tiếp cận), Vite bundler.
- **Quản lý Định tuyến (Routing)**: `react-router-dom` v7 với cơ chế `ProtectedRoute` bảo vệ các trang Dashboard, tự động điều hướng người dùng chưa đăng nhập về `/login`.
- **Dịch vụ mạng (`api.js`)**:
  - Tích hợp **Axios Interceptors**:
    - Request: Tự động trích xuất Token từ `localStorage` và gắn Header `Authorization: Bearer <token>`.
    - Response: Tự động bắt mã lỗi `401 Unauthorized` khi Token hết hạn để xóa phiên và chuyển hướng người dùng đăng nhập lại.
- **Trạng thái Xác thực (`AuthContext.jsx`)**:
  - Cung cấp hook `useAuth()` cho toàn bộ cây component để truy xuất thông tin `user`, hàm `login()`, `register()`, `logout()`.

### 2. Các trang màn hình chính:
- **Trang Đăng Nhập (`Login.jsx`)** & **Đăng Ký (`Register.jsx`)**: Form hiện đại với icon trực quan, thông báo lỗi validation chi tiết.
- **Trang Không Gian Làm Việc (`Dashboard.jsx`)**:
  - Thống kê tỷ lệ hoàn thành công việc theo từng dự án dưới dạng Progress Bar trực quan.
  - Modal tạo mới dự án nhanh với mã dự án viết hoa tự động (`PRJ`, `PORTAL`).
  - Thẻ thông tin dự án hiển thị trạng thái và số lượng công việc hoàn thành.


---

## 10. Chi tiết Bảng Kanban & Tương Tác Công Việc (Kanban Board & Task Detail)

Được triển khai trên nhánh `feature/project-details-and-kanban`:

### 1. Luồng Bảng Kanban Dự Án (`ProjectDetail.jsx`)
- Hiển thị theo 4 cột tiến độ chuẩn Agile/Scrum:
  - **Cần làm (Todo)**
  - **Đang làm (In Progress)**
  - **Chờ duyệt (In Review)**
  - **Hoàn thành (Done)**
- Mỗi thẻ công việc (Task Card) hiển thị:
  - Mã công việc sinh tự động (`TaskCode`: ví dụ `PRJ-1`).
  - Huy hiệu độ ưu tiên (`Thấp`, `Trung bình`, `Cao`, `Khẩn cấp`).
  - Hạn hoàn thành (`DueDate`).
  - Hộp chọn nhanh trạng thái (Status Dropdown) cho phép cập nhật tiến độ công việc ngay lập tức trên UI và gọi API đồng bộ xuống Database.

### 2. Chi tiết Công Việc & Thảo Luận Trao Đổi
- Nhấp vào bất kỳ thẻ công việc nào sẽ mở modal chi tiết:
  - Xem mô tả đầy đủ.
  - Phân hệ **Thảo luận (Comments)** thời gian thực: Cho phép thành viên trong dự án trao đổi, ghi chú kết quả công việc, lưu lại dấu thời gian và người bình luận.


---

## 11. Phân Hệ Thống Kê Hiệu Suất & Phân Bổ Tải (Analytics & Workload Allocation)

Kế thừa trực tiếp từ bài toán thực tế `allocate-task-statistic` của dự án Talgent:

### 1. Thuật toán Phân Bổ Tải (`AllocateTaskStatistic`)
- **Tỷ lệ hoàn thành dự án (`CompletionRate`)**: 
  $$\text{CompletionRate} = \frac{\text{DoneTasks}}{\text{TotalTasks}} \times 100\%$$
- **Tỷ lệ phân bổ công việc theo từng thành viên (`AllocationPercentage`)**:
  $$\text{AllocationPercentage} = \frac{\text{MemberTotalTasks}}{\text{ProjectTotalTasks}} \times 100\%$$
- Thước đo này giúp Ban Quản lý Dự án (PM) đánh giá trực quan xem thành viên nào đang bị quá tải (overload) hoặc ai đang có ít việc để cân đối lại nhân lực.

### 2. Quản lý Đội Ngũ & Mời Thành Viên (`AddMember`)
- Hỗ trợ nhập Email để tìm kiếm người dùng và gán quyền trực tiếp vào dự án với các vai trò:
  - `Project Manager`: Quản lý toàn quyền dự án.
  - `Member`: Thành viên thực thi công việc.
  - `Viewer`: Khách hàng hoặc đối tác theo dõi tiến độ.


---

## 12. Phân Hệ Biên Bản Cuộc Họp & Phân Công Hành Động (Meeting Notes & Action Items)

Kế thừa trực tiếp từ `MeetingNoteController.cs` trong codebase Talgent:

### 1. Ý nghĩa Nghiệp vụ
- Trong môi trường doanh nghiệp, các buổi họp giao ban / Sprint Review / Daily Standup đều cần lưu lại biên bản:
  - **Chủ đề cuộc họp (`Title`)**: Xác định mục tiêu buổi họp.
  - **Ngày họp (`MeetingDate`) & Người tham dự (`Attendees`)**: Truy vết thành phần tham gia.
  - **Nội dung thảo luận & Quyết định (`Content`)**: Tóm tắt kết quả thống nhất.
  - **Hạng mục hành động (`ActionItems`)**: Giao việc cụ thể (Ai làm gì, trước deadline nào) để sau đó chuyển thành các Tasks trên bảng Kanban.

### 2. Thiết kế Kiến trúc
- Entity `MeetingNote.cs` kế thừa `BaseEntity` (có Soft Delete tự động).
- `MeetingNoteService.cs` cung cấp CRUD độc lập qua `IMeetingNoteService`.
- `MeetingNotesController.cs` bảo vệ toàn diện với `[Authorize]`.
- Frontend tích hợp thành một Tab độc lập `Biên Bản Cuộc Họp` trên màn hình dự án.


---

## 13. Tương Tác Kéo Thả Trực Quan (HTML5 Drag and Drop Kanban)

Được triển khai trên nhánh `feature/drag-and-drop-kanban`:

### 1. Kỹ thuật Triển khai (HTML5 Drag and Drop API)
- **Tối ưu hóa không phụ thuộc thư viện nặng**: Sử dụng trực tiếp API `drag & drop` gốc của trình duyệt (HTML5 Drag and Drop), không cần cài đặt thêm gói npm bên ngoài, giúp ứng dụng nhẹ và mượt mà.
- **Sự kiện Kéo Thả**:
  - `onDragStart`: Lưu `taskId` vào `dataTransfer`.
  - `onDragOver` & `onDragLeave`: Cung cấp phản hồi thị giác (Visual feedback) viền xanh dashed (`column-drag-over`) khi rê chuột qua cột.
  - `onDrop`: Lấy `colId` đích, cập nhật giao diện lập tức (Optimistic UI update) và gọi API `PUT /api/tasks/{id}` đồng bộ xuống cơ sở dữ liệu.


---

## 14. Tích Hợp Hệ Thống Icon Chuẩn Doanh Nghiệp (Material UI Icons)

Được triển khai trên nhánh `feature/mui-icons-integration`:

### 1. Lựa chọn Công nghệ: Google Material Design (MUI) thay vì Bootstrap
- So với Bootstrap (thiên về các lớp CSS tĩnh), **MUI (Material UI)** là thư viện hàng đầu trong hệ sinh thái React:
  - Cung cấp component React dạng SVG native: `@mui/icons-material`.
  - Hỗ trợ tùy biến kích thước và màu sắc linh hoạt qua props: `fontSize="small"`, `color="primary"`, `color="success"`.
  - Giúp giao diện ứng dụng mang phong cách hiện đại của các sản phẩm Google / Enterprise Dashboard.

### 2. Các Icon Được Tích Hợp Xuyên Suốt:
- **Xác thực**: `LoginIcon`, `PersonAddOutlinedIcon`, `LockOutlinedIcon`, `EmailOutlinedIcon`.
- **Dự án & Không gian làm việc**: `FolderSpecialOutlinedIcon`, `AddIcon`, `CheckCircleOutlineOutlinedIcon`, `CalendarMonthOutlinedIcon`.
- **Kanban & Công việc**: `ViewKanbanOutlinedIcon`, `DragIndicatorIcon`, `AccessTimeIcon`, `ChatBubbleOutlineOutlinedIcon`.
- **Cộng tác & Biên bản họp**: `DescriptionOutlinedIcon`, `PeopleAltOutlinedIcon`, `PersonAddAlt1OutlinedIcon`, `DeleteOutlineOutlinedIcon`.

---

## 15. Kiến Trúc SCSS Module Hóa (7-1 Pattern) & Tối Ưu Trải Nghiệm Giao Diện (UI/UX)

### 15.1. Bối cảnh & Vấn đề giải quyết
1. **Lỗi hiển thị độ tương phản (Low Contrast / White on White)**:
   - Trước đây do kế thừa cấu hình mặc định `@media (prefers-color-scheme: dark)` trong Vite `index.css`, các tiêu đề `h1, h2, h3` bị gán màu `--text-h: #f3f4f6` (màu trắng ngà), dẫn tới hiện tượng chữ bị "chìm" không nhìn thấy trên nền sáng.
   - Bố cục màn hình `#root` bị giới hạn cứng ở `1126px` căn giữa khiến không gian làm việc bị thu hẹp bất hợp lý.
2. **Cấu trúc SCSS nguyên khối (Monolithic CSS)**:
   - Dồn toàn bộ hàng trăm dòng CSS vào `App.css` hoặc `App.scss` duy nhất gây khó khăn trong việc mở rộng, bảo trì và cô lập phạm vi kiểu dáng.

### 15.2. Cấu trúc thư mục Modular SCSS trong `frontend/src/assets/styles/`
Dự án áp dụng mô hình chuẩn công nghiệp chia nhỏ các module SCSS:
```
frontend/src/assets/styles/
├── _variables.scss      # Hệ thống Design Tokens: Palette màu Slate/Blue, typography, shadows, border-radius
├── _reset.scss          # Full CSS Reset, căn chỉnh #root 100% width, ép màu heading độ tương phản cao (#0f172a)
├── _components.scss     # Nút bấm (.btn-primary, .btn-secondary), Forms, Badges, Modals (.modal-backdrop), Alerts
├── _auth.scss           # Giao diện Đăng nhập & Đăng ký (Card căn giữa, input nền trắng, autocomplete fix)
├── _dashboard.scss      # Không gian làm việc, Navbar, lưới thẻ dự án (Project Cards), thanh tiến độ hoàn thành
├── _kanban.scss         # Bảng Kanban 4 cột, hiệu ứng kéo thả (.column-drag-over), thẻ công việc, thẻ ưu tiên
├── _meeting_notes.scss  # Nhật ký cuộc họp, thẻ biên bản, danh sách action items
├── _analytics.scss      # Thống kê hiệu suất KPI, bảng phân bổ tải thành viên (Workload Allocation)
├── _discussion.scss     # Modal chi tiết task, luồng bình luận thảo luận thời gian thực, input gửi phản hồi
└── main.scss            # Tệp điều phối tập trung import toàn bộ các thành phần
```

### 15.3. Giá trị đạt được
- **Độ tương phản tiêu chuẩn WCAG AAA**: Tiêu đề luôn hiển thị rõ nét với màu `#0f172a`, mô tả và ngày tháng phân cấp rõ ràng bằng `#475569` và `#64748b`.
- **Hiệu năng biên dịch**: Vite Sass biên dịch trực tiếp toàn bộ hệ thống SCSS chỉ trong ~500ms, tệp build CSS nén gzip chỉ còn ~4.2 kB.



---

## 16. Phân Hệ Không Gian Làm Việc Cá Nhân & Quản Lý Công Việc Của Tôi (Personal Workspace & My Tasks)

### 16.1. Nghiệp vụ & Kế thừa từ Talgent
- Trong các nền tảng quản lý dự án doanh nghiệp lớn (như Talgent với `PersonalWorkSpaceController`), người dùng không chỉ xem danh sách dự án mà cần một trang cá nhân tập trung (**My Tasks**) để theo dõi tất cả đầu việc được phân công trên nhiều dự án khác nhau.
- Các yêu cầu cốt lõi được kế thừa:
  1. **Tập trung hóa công việc**: Tự động gom toàn bộ các công việc gán cho tài khoản đăng nhập hiện tại từ mọi dự án mà thành viên tham gia.
  2. **Bộ lọc đa chiều theo tiến trình**:
     - *Hôm nay (Due Today)*: Các task có hạn chót trong ngày.
     - *Quá hạn (Overdue)*: Các task chưa xong có `DueDate < Today`, hiển thị cảnh báo đỏ nổi bật.
     - *Đang thực hiện (In Progress)* & *Đã xong (Completed)*.
  3. **Cập nhật nhanh trạng thái (Quick Transition)**: Thay đổi trạng thái công việc trực tiếp từ màn hình cá nhân mà không cần tìm mở từng dự án riêng lẻ.
  4. **Tìm kiếm & Lọc theo Dự án**: Hỗ trợ tìm kiếm theo từ khóa hoặc chọn xem công việc của một dự án nhất định.
  5. **Chỉ định người thực hiện khi tạo Task**: Khi tạo task trong bảng Kanban, cho phép gán trực tiếp thành viên trong dự án làm Assignee.

### 16.2. Thiết kế API Backend
- **`GET /api/tasks/my-tasks`**: Trả về danh sách `MyTaskResponseDto` kèm mã dự án (`ProjectCode`), tên dự án (`ProjectName`), số lượng thảo luận (`CommentCount`) và cờ cảnh báo quá hạn (`IsOverdue`). Sắp xếp tự động ưu tiên: Quá hạn -> Hạn gần nhất -> Độ ưu tiên cao.
- **`PATCH /api/tasks/{id}/assign`**: API chỉ định hoặc chuyển giao người thực hiện cho công việc.
