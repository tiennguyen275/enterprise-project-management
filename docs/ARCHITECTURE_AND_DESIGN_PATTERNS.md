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
