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
