# CẨM NANG THUYẾT TRÌNH, PHẢN BIỆN & CỦNG CỐ KIẾN THỨC TOÀN DIỆN
## DỰ ÁN ENTERPRISE PROJECT MANAGEMENT (.NET Core + ReactJS)

> **Tài liệu độc quyền:** Tổng hợp toàn bộ kiến thức cốt lõi về Kiến trúc hệ thống, Nguyên lý thiết kế (SOLID, Clean Architecture, Design Patterns), Luồng dữ liệu (.NET Core & ReactJS), cùng Kịch bản Demo và Bộ câu hỏi phản biện thực chiến dành cho tác giả đồ án.

---

# MỤC LỤC

1. [Tâm thế & Chiến Lược Thuyết Trình Đỉnh Cao](#1-tâm-thế--chiến-lược-thuyết-trình-đỉnh-cao)
2. [Kịch Bản Demo 5–7 Phút Thần Thái](#2-kịch-bản-demo-57-phút-thần-thái)
3. [Clean Architecture (Kiến Trúc Củ Hành - 4 Tầng)](#3-clean-architecture-kiến-trúc-củ-hành---4-tầng)
4. [Nguyên Lý S.O.L.I.D Trong Dự Án (Kèm Vị Trí Code Thực Tế)](#4-nguyên-lý-solid-trong-dự-án-kèm-vị-trí-code-thực-tế)
5. [Các Design Patterns Cốt Lõi Được Áp Dụng](#5-các-design-patterns-cốt-lõi-được-áp-dụng)
6. [.NET Core Backend – Bản Chất Kỹ Thuật Trong 5 Phút](#6-net-core-backend--bản-chất-kỹ-thuật-trong-5-phút)
7. [ReactJS Frontend – Bản Chất Kỹ Thuật Trong 5 Phút](#7-reactjs-frontend--bản-chất-kỹ-thuật-trong-5-phút)
8. [Bộ 12 Câu Hỏi Vấn Đáp Hội Đồng Hay Hỏi Nhất & Câu Trả Lời Mẫu](#8-bộ-12-câu-hỏi-vấn-đáp-hội-đồng-hay-hỏi-nhất--câu-trả-lời-mẫu)

---

# 1. TÂM THẾ & CHIẾN LƯỢC THUYẾT TRÌNH ĐỈNH CAO

### 1.1. Sự thật về buổi chấm đồ án / bảo vệ kỹ thuật
- **Hội đồng KHÔNG chấm điểm xem bạn gõ code nhanh thế nào hay có nhớ từng cú pháp không.**
- Họ đánh giá bạn ở 3 điểm lớn:
  1. **Tư duy Kiến trúc (Architecture):** Tại sao bạn chia thư mục như vậy? Tại sao tách Controller và Service?
  2. **Giá trị Nghiệp vụ (Business Value):** Dự án giải quyết được bài toán gì cho doanh nghiệp?
  3. **Mức độ làm chủ hệ thống (System Ownership):** Bạn có hiểu dữ liệu chạy từ đâu tới đâu không?

### 1.2. Công thức "Phao Cứu Sinh" khi quên code
Nếu giám khảo chỉ vào một dòng code lạ hoặc hỏi dồn chi tiết mà bạn chưa nhớ ra ngay:
1. **Bình tĩnh gật đầu:** *"Dạ thưa thầy/cô, ở đoạn xử lý cụ thể này..."*
2. **Lái về tư duy kiến trúc và luồng dữ liệu:** *"...luồng nghiệp vụ của nó là nhận DTO từ tầng API Controller, chuyển xuống tầng Application Service để xử lý nghiệp vụ, sau đó gọi qua Interface `IRepository` và kết thúc bằng `IUnitOfWork.SaveChangesAsync()` để commit dữ liệu an toàn theo transaction."*
3. **Mở đúng file minh chứng:** Chủ động mở file `Service` hoặc `Controller` lên chỉ vào hàm đó để cùng giải thích.

---

# 2. KỊCH BẢN DEMO 5–7 PHÚT THẦN THÁI

Tuyệt đối **không click chuột lung tung**. Hãy dẫn dắt người nghe theo đúng một hành trình nghiệp vụ (User Journey):

```text
[ Đăng nhập ] ──► [ Dashboard ] ──► [ Dự án & Kanban ] ──► [ Họp & Action Items ] ──► [ Báo cáo Sức khỏe ] ──► [ Trợ lý AI ] ──► [ My Tasks ]
```

### Bước 1: Giới thiệu bài toán & Đăng nhập (1 phút)
- **Lời thoại mẫu:** *"Hệ thống Enterprise Project Management được xây dựng nhằm giải quyết bài toán quản trị dự án, tối ưu hóa phân bổ tải công việc và theo dõi sức khỏe dự án theo thời gian thực cho doanh nghiệp."*
- Đăng nhập tài khoản với JWT Stateless Authentication.

### Bước 2: Không gian làm việc (Workspace Dashboard) (1 phút)
- Chỉ vào danh sách dự án với thanh tiến độ hoàn thành (Progress Bar).
- Nhấn mạnh tính năng hiển thị trực quan tỷ lệ Task hoàn thành / Tổng Task.

### Bước 3: Bảng Kanban & Tương tác kéo thả (2 phút)
- Chọn một dự án để vào màn hình chi tiết (`ProjectDetail.jsx`).
- **Thực hiện kéo thả 1 Task** từ `Todo` sang `In Progress`:
  - Giải thích: Sử dụng **HTML5 Drag and Drop API native**, có hiệu ứng viền đứt đoạn đổi màu khi rê chuột, cập nhật giao diện ngay lập tức (Optimistic UI) và gửi API `PUT /api/tasks/{id}` đồng bộ xuống cơ sở dữ liệu.
- Mở chi tiết 1 Task: Chỉ ra phân hệ **Thảo luận (Comments)** và **Subtasks** dạng cây.

### Bước 4: Biên bản cuộc họp (Meeting Notes) & Phân bổ tải (Workload) (1.5 phút)
- Chuyển sang Tab **Biên bản cuộc họp**: Chỉ ra điểm đặc sắc — mỗi buổi họp đều lưu lại người tham dự, nội dung thống nhất và danh sách **Action Items** để biến thành Task thực tế.
- Chuyển sang Tab **Thống kê (Analytics)**: Chỉ vào chỉ số **Workload Allocation** (Tỷ lệ phân bổ công việc theo thành viên). Giải thích đây là công cụ giúp Project Manager (PM) phát hiện ai đang bị quá tải hoặc thiếu việc.

### Bước 5: Báo cáo sức khỏe dự án (Status Reports) (1 phút)
- Mở Tab **Báo cáo tiến độ**: Show các đánh giá sức khỏe (`On Track`, `At Risk`, `Delayed`), thành tựu đạt được và rủi ro/trở ngại.

### Bước 6: Trợ lý AI gợi ý (1 phút)
- Trong Tab **Báo cáo sức khỏe**, bấm **Phân tích dự án**: AI đọc số liệu thật (tiến độ, việc quá hạn, điểm R/A/G) rồi nhận xét ngắn gồm đánh giá chung, rủi ro chính và việc nên làm ngay.
- Mở chi tiết một công việc, bấm **Gợi ý việc con bằng AI** rồi bấm **Thêm** ở những việc con phù hợp.
- Bấm **Gợi ý người nhận việc**: hệ thống xếp hạng thành viên theo khối lượng việc đang mở. Phần này là thuật toán cân bằng tải, không phụ thuộc AI.
- Lời thoại gợi ý: *"AI chỉ là lớp hỗ trợ ra quyết định, số liệu nền vẫn do hệ thống tính toán."*

### Bước 7: Không gian cá nhân (My Tasks) (0.5 phút)
- Mở trang **My Tasks**: Thể hiện góc nhìn của một thành viên thực thi, gom toàn bộ task từ nhiều dự án khác nhau, có cờ cảnh báo đỏ khi bị **Quá hạn (Overdue)**.

---

# 3. CLEAN ARCHITECTURE (KIẾN TRÚC CỦ HÀNH - 4 TẦNG)

### 3.1. Sơ đồ 4 tầng trong dự án

```text
[ API (Controllers, Auth) ]
       │
       ▼ (gọi vào)
[ Infrastructure (EF Core, SQL Server, Email) ]
       │
       ▼ (triển khai Interface của)
[ Application (Services, DTOs, Business Rules, Interfaces) ]
       │
       ▼ (sử dụng thực thể của)
[ Domain (Entities, Enums - Lõi trung tâm không phụ thuộc ai) ]
```

### 3.2. Bảng phân tích chi tiết từng tầng

| Tầng | Thư mục trong dự án | Trách nhiệm cốt lõi | Các tệp tiêu biểu |
| :--- | :--- | :--- | :--- |
| **Domain** | `backend/.../Domain/` | Là "Hiến pháp" của hệ thống. Chứa các thực thể cốt lõi, không chứa bất kỳ logic cơ sở dữ liệu hay thư viện ngoài nào. | `BaseEntity.cs`<br>`User.cs`<br>`Project.cs`<br>`ProjectTask.cs`<br>`ProjectStatusReport.cs` |
| **Application** | `backend/.../Application/` | Là "Bộ não điều phối nghiệp vụ". Định nghĩa Interface (`IRepository`, `IUnitOfWork`), tạo DTOs, thực thi các tính toán logic và kiểm tra quyền. | `IRepository.cs`<br>`IUnitOfWork.cs`<br>`IAiTextGenerator.cs`<br>`IRealtimeNotificationService.cs`<br>`TaskService.cs`<br>`StatusReportService.cs`<br>`AiAssistantService.cs`<br>`ProjectChatService.cs`<br>`ScheduleService.cs` |
| **Infrastructure** | `backend/.../Infrastructure/` | Là "Công nhân kỹ thuật". Cài đặt EF Core, kết nối SQL Server, cấu hình Soft Delete, Fluent API. Triển khai các Interface của tầng Application. | `ApplicationDbContext.cs`<br>`Repository.cs`<br>`UnitOfWork.cs`<br>`GeminiTextGenerator.cs` |
| **Api** | `backend/.../Api/` | Là "Nhân viên tiếp tân". Nhận HTTP request từ ReactJS, xác thực JWT qua `[Authorize]`, gọi tầng Application xử lý và trả về JSON. | `Program.cs`<br>`ProjectHub.cs`<br>`ProjectsController.cs`<br>`TasksController.cs`<br>`StatusReportsController.cs`<br>`AiAssistantController.cs`<br>`ProjectChatController.cs`<br>`ScheduleController.cs` |

> **Nguyên tắc vàng Clean Architecture:** Mũi tên phụ thuộc chỉ đi từ ngoài vào trong. Tầng `Domain` và `Application` hoàn toàn không phụ thuộc vào SQL Server hay EF Core. Khi muốn đổi DB sang PostgreSQL hoặc viết Unit Test Mock, ta không cần sửa một dòng code nghiệp vụ nào.

---

# 4. NGUYÊN LÝ S.O.L.I.D TRONG DỰ ÁN (KÈM VỊ TRÍ CODE THỰC TẾ)

Khi hội đồng hỏi: *"Em đã áp dụng 5 nguyên tắc SOLID như thế nào trong dự án?"*, bạn trả lời theo 5 điểm sau:

### S – Single Responsibility Principle (Đơn trách nhiệm)
- **Quy tắc:** Mỗi class chỉ đảm nhận **một trách nhiệm duy nhất**.
- **Minh chứng code:**
  - `ProjectTask.cs`: Chỉ mang thông tin thực thể công việc, không chứa code truy vấn DB.
  - `Repository<T>.cs`: Chỉ đảm nhận việc tương tác dữ liệu CRUD với Database.
  - `UnitOfWork.cs`: Chỉ quản lý việc commit Transaction (`SaveChangesAsync`).
  - `TaskService.cs`: Chỉ đảm nhận tính toán nghiệp vụ (tự sinh mã TaskCode, kiểm tra hạn chót).

### O – Open/Closed Principle (Mở để mở rộng, Đóng để sửa đổi)
- **Quy tắc:** Hệ thống mở để mở rộng tính năng mới, nhưng đóng (không làm xáo trộn) code cũ đã ổn định.
- **Minh chứng code:**
  - `BaseEntity.cs` có sẵn: `Id`, `CreatedAt`, `IsDeleted`.
  - Khi cần thêm các phân hệ mới như `MeetingNote` (Biên bản họp) hay `ProjectStatusReport` (Báo cáo sức khỏe), ta chỉ cần tạo Entity mới kế thừa `BaseEntity` mà không cần chạm vào hay sửa đổi mã nguồn của `BaseEntity`.

### L – Liskov Substitution Principle (Thay thế Liskov)
- **Quy tắc:** Mọi lớp con đều có thể thay thế hoàn toàn cho lớp cha mà không làm sai lệch tính đúng đắn của logic.
- **Minh chứng code:**
  - Tất cả các Entity (`User`, `Project`, `ProjectTask`) đều là lớp con của `BaseEntity`.
  - Generic Repository được khai báo: `public class Repository<T> : IRepository<T> where T : BaseEntity`.
  - Bạn có thể truyền bất kỳ Entity nào vào `Repository<Project>` hay `Repository<ProjectTask>`, các hàm `GetByIdAsync`, `DeleteAsync` đều hoạt động chuẩn xác.

### I – Interface Segregation Principle (Phân tách Interface)
- **Quy tắc:** Không tạo một Interface khổng lồ "ôm đồm" mọi thứ ép các class phải triển khai những hàm thừa.
- **Minh chứng code:**
  - `IRepository<T>`: Chỉ chứa các thao tác CRUD cơ bản.
  - `IUnitOfWork`: Chỉ quản lý Transaction (`SaveChangesAsync`).
  - `IStatusReportService`: Chỉ chứa nghiệp vụ báo cáo sức khỏe dự án.

### D – Dependency Inversion Principle (Đảo ngược phụ thuộc)
- **Quy tắc:** Tầng cấp cao không phụ thuộc vào tầng cấp thấp, cả hai cùng phụ thuộc vào Interface (Abstraction).
- **Minh chứng code (File `StatusReportService.cs`):**
  ```csharp
  public class StatusReportService : IStatusReportService
  {
      private readonly IRepository<ProjectStatusReport> _reportRepository;
      private readonly IRepository<Project> _projectRepository;
      private readonly IUnitOfWork _unitOfWork;

      // Tiêm phụ thuộc qua Constructor, KHÔNG tự new SqlRepository()
      public StatusReportService(
          IRepository<ProjectStatusReport> reportRepo,
          IRepository<Project> projectRepo,
          IUnitOfWork unitOfWork)
      {
          _reportRepository = reportRepo;
          _projectRepository = projectRepo;
          _unitOfWork = unitOfWork;
      }
  }
  ```
  * `StatusReportService` không quan tâm dữ liệu nằm ở SQL Server hay Postgres, nó chỉ biết gọi qua `IRepository`.

---

# 5. CÁC DESIGN PATTERNS CỐT LÕI ĐƯỢC ÁP DỤNG

### 1. Repository Pattern (Kiến trúc / Truy xuất dữ liệu)
- **Nơi áp dụng:** `IRepository<T>` và `Repository<T>`.
- **Mục đích:** Tách biệt hoàn toàn tầng logic nghiệp vụ khỏi tầng cơ sở dữ liệu. Che giấu các câu lệnh EF Core phức tạp sau các hàm ngữ nghĩa (`GetByIdAsync`, `GetAllAsync`, `FindAsync`).

### 2. Unit of Work Pattern (Hành vi / Quản lý Transaction)
- **Nơi áp dụng:** `IUnitOfWork` và `UnitOfWork.cs`.
- **Mục đích:** Đảm bảo toàn vẹn dữ liệu (Atomicity). Khi một hành động nghiệp vụ cần thêm Task, cập nhật số lượng của Dự án và ghi lại lịch sử, tất cả được thực hiện trong cùng **1 Transaction duy nhất**. Chỉ khi gọi `_unitOfWork.SaveChangesAsync()`, mọi thứ mới được lưu. Nếu có 1 bước lỗi, toàn bộ sẽ tự động Rollback, không để lại dữ liệu rác.

### 3. Dependency Injection (Khởi tạo đối tượng)
- **Nơi áp dụng:** `Program.cs` và Constructor của các Service/Controller.
- **Mục đích:** Thay vì dùng `new Service()` thủ công, Container của .NET Core sẽ tự động khởi tạo và tiêm (inject) các phụ thuộc cần thiết vào nơi yêu cầu.

### 4. Soft Delete Pattern (Mô hình xóa mềm)
- **Nơi áp dụng:** Cờ `IsDeleted` trong `BaseEntity` và `ApplicationDbContext.cs`.
- **Mục đích:** Khi người dùng bấm xóa, dữ liệu chỉ chuyển cờ `IsDeleted = true` chứ không xóa khỏi ổ đĩa. Giúp bảo toàn dữ liệu lịch sử doanh nghiệp. Kết hợp với **Global Query Filter**:
  ```csharp
  modelBuilder.Entity<ProjectTask>().HasQueryFilter(e => !e.IsDeleted);
  ```
  Tự động gắn `WHERE IsDeleted = 0` vào tất cả các câu truy vấn LINQ.

---

# 6. .NET CORE BACKEND – BẢN CHẤT KỸ THUẬT TRONG 5 PHÚT

### 6.1. Vòng đời Request (Request Pipeline)
1. Request từ Client gửi tới $\rightarrow$ Qua Middleware xác thực **JWT Bearer**.
2. Kiểm tra chính sách **CORS Policy (`AllowReactApp`)**.
3. Đi vào **Controller** $\rightarrow$ Kích hoạt `[Authorize]` kiểm tra quyền.
4. Controller gọi **Service** xử lý nghiệp vụ.
5. Service gọi **Repository** để truy vấn DB.
6. Kết quả chuyển đổi thành **DTO** và trả về mã `200 OK` (JSON).

### 6.2. Các khái niệm hay bị hỏi nhất
* **`async / await` & `Task`:** Xử lý bất đồng bộ không chặn luồng (Non-blocking I/O). Trong khi chờ Database trả kết quả, luồng CPU quay sang phục vụ người dùng khác, giúp server chịu tải hàng nghìn kết nối đồng thời.
* **`Scoped` vs `Transient` vs `Singleton`:**
  - *Transient:* Tạo mới mỗi lần được gọi (dùng cho các tác vụ tính toán nhẹ không trạng thái).
  - *Scoped (Dự án dùng cho DbContext, Service, Repo):* Tạo một đối tượng duy nhất cho **mỗi HTTP Request**, kết thúc request sẽ tự giải phóng.
  - *Singleton:* Tạo một đối tượng duy nhất cho toàn bộ vòng đời của ứng dụng (dùng cho Cache, Cấu hình).
* **`DTO` (Data Transfer Object) vs `Entity`:**
  - *Entity:* Là bảng cơ sở dữ liệu (`User`, `Project`).
  - *DTO:* Là gói dữ liệu gửi qua mạng (`LoginRequestDto`, `ProjectDetailDto`).
  - *Lý do dùng DTO:* Tránh lộ thông tin nhạy cảm (mật khẩu), tránh lỗi vòng lặp dữ liệu (Circular Reference) và tối ưu dung lượng mạng.
* **`BCrypt`:** Thuật toán băm mật khẩu 1 chiều chuẩn công nghiệp (`BCrypt.HashPassword`), tuyệt đối không lưu mật khẩu dạng rõ (plain text).

---

# 7. REACTJS FRONTEND – BẢN CHẤT KỸ THUẬT TRONG 5 PHÚT

### 7.1. Ba Hooks quyền lực nhất trong dự án
1. **`useState`:** Lưu trạng thái dữ liệu giao diện (ví dụ: `const [tasks, setTasks] = useState([])`). Khi gọi `setTasks(danhSachMoi)`, React sẽ **tự động vẽ lại (re-render)** giao diện.
2. **`useEffect`:** Xử lý tác vụ phụ (Side Effect) như gọi API lấy dữ liệu khi người dùng vừa vào trang.
   - `useEffect(() => { ... }, [])`: Mảng rỗng nghĩa là chỉ chạy **1 lần duy nhất khi Component xuất hiện (Mount)**.
   - `useEffect(() => { ... }, [id])`: Chạy lại mỗi khi giá trị `id` trên đường dẫn URL thay đổi.
3. **`useAuth` (dựa trên `useContext`):** Chia sẻ thông tin tài khoản đăng nhập (`user`, `token`, `logout`) cho toàn bộ ứng dụng mà không cần truyền biến qua nhiều tầng Component.

### 7.2. Tối ưu hóa tải song song (`Promise.all`)
Trong file `ProjectDetail.jsx`:
```javascript
const [projRes, tasksRes, analyticsRes, notesRes, healthRes] = await Promise.all([
  api.get(`/projects/${id}`),
  api.get(`/tasks/project/${id}`),
  api.get(`/projects/${id}/analytics`),
  api.get(`/meeting-notes/project/${id}`),
  api.get(`/status-reports/health-and-reports/${id}`)
]);
```
- **Ý nghĩa:** Thay vì gọi lần lượt 5 API mất 5 khoảng thời gian chờ (Tuần tự), ta bắn cả 5 API cùng một lúc (Song song), giúp màn hình tải nhanh gấp 3–4 lần.

### 7.3. Tự động hóa kết nối qua `api.js` (Axios Interceptors)
- **Request Interceptor:** Tự động đọc Token từ `localStorage` và gắn `Authorization: Bearer <token>` vào mọi yêu cầu.
- **Response Interceptor:** Lắng nghe phản hồi từ Server. Nếu gặp mã lỗi `401 Unauthorized` (Token hết hạn hoặc giả mạo), tự động xóa phiên đăng nhập và chuyển hướng người dùng về trang `/login`.

---

# 8. BỘ 12 CÂU HỎI VẤN ĐÁP HỘI ĐỒNG HAY HỎI NHẤT & CÂU TRẢ LỜI MẪU

### Câu 1: Em hãy giải thích cơ chế xác thực JWT trong dự án?
> **Trả lời:** *"Dạ thưa thầy/cô, hệ thống sử dụng cơ chế xác thực phi trạng thái (Stateless). Khi người dùng đăng nhập đúng, backend băm mật khẩu bằng BCrypt để kiểm tra. Nếu hợp lệ, hệ thống tạo chuỗi JWT chứa các Claims (UserId, Email) và ký bằng khóa bí mật bí mật (Secret Key). Client lưu Token vào `localStorage` và đính kèm vào Header của mỗi request qua Axios Interceptor. Backend dùng middleware `[Authorize]` giải mã Token để nhận diện người dùng mà không cần truy vấn lại bảng User."*

### Câu 2: Tại sao em dùng Repository Pattern mà không gọi trực tiếp DbContext trong Controller?
> **Trả lời:** *"Dạ, nếu gọi trực tiếp DbContext trong Controller thì tầng API sẽ bị dính chặt vào Entity Framework và SQL Server. Em áp dụng `Repository Pattern` để che giấu tầng lưu trữ dữ liệu sau Interface `IRepository<T>`. Nhờ vậy, Controller và Service chỉ làm việc với các phương thức trừu tượng, giúp dễ dàng thay đổi công nghệ cơ sở dữ liệu sau này và thuận tiện viết Unit Test bằng cách Mock Repository."*

### Câu 3: Unit of Work đóng vai trò gì? Nếu không dùng có sao không?
> **Trả lời:** *"Dạ, Unit of Work quản lý Transaction cho toàn bộ các thao tác trong 1 nghiệp vụ. Nếu không dùng Unit of Work mà mỗi Repository tự gọi `SaveChanges()`, thì khi nghiệp vụ gồm 3 bước (ví dụ: tạo Task, trừ giờ dự án, ghi lịch sử) mà bước thứ 3 bị lỗi, 2 bước trước đã lưu vào DB rồi sẽ gây ra hiện tượng rác và sai lệch dữ liệu. Unit of Work đảm bảo: hoặc tất cả thành công, hoặc rollback toàn bộ."*

### Câu 4: Kéo thả trên bảng Kanban hoạt động như thế nào ở phía code?
> **Trả lời:** *"Dạ, em dùng trực tiếp HTML5 Drag and Drop API native của trình duyệt:
> 1. Sự kiện `onDragStart`: Lưu `taskId` của thẻ đang kéo.
> 2. Sự kiện `onDragOver`: Hiển thị viền đứt đoạn đổi màu xanh cho cột đích để tạo phản hồi thị giác.
> 3. Sự kiện `onDrop`: Lấy mã trạng thái của cột đích, cập nhật ngay State ở giao diện (Optimistic UI) để người dùng thấy mượt mà, đồng thời gọi API `PUT /api/tasks/{id}` với trạng thái mới để cập nhật xuống DB."*

### Câu 5: DTO là gì? Tại sao không trả thẳng Entity từ Database ra cho React?
> **Trả lời:** *"Dạ, có 3 lý do:
> 1. **Bảo mật:** Entity `User` chứa trường `PasswordHash`, nếu trả thẳng Entity ra ngoài sẽ để lộ thông tin nhạy cảm.
> 2. **Tránh lỗi lặp vô tận (Circular Reference):** Các Entity có liên kết 2 chiều (ví dụ: Project chứa Tasks, Task lại chứa Project cha), nếu serialize thẳng ra JSON sẽ bị lỗi tràn bộ nhớ.
> 3. **Tối ưu băng thông:** DTO chỉ đóng gói đúng những trường dữ liệu mà màn hình đó cần hiển thị."*

### Câu 6: Dự án của em cấu hình Dependency Injection theo vòng đời nào?
> **Trả lời:** *"Dạ, dự án của em sử dụng chủ yếu là **Scoped** cho `ApplicationDbContext`, các `Repository` và các `Service` (được cấu hình trong `DependencyInjection.cs`). Mỗi HTTP Request gửi lên sẽ tạo ra một instance duy nhất và tự động giải phóng khi request hoàn tất, đảm bảo an toàn luồng và không bị xung đột dữ liệu giữa các người dùng."*

### Câu 7: CORS là gì và em đã cấu hình nó như thế nào?
> **Trả lời:** *"Dạ, CORS là cơ chế an toàn của trình duyệt ngăn chặn trang web ở nguồn này gọi API của nguồn khác. Vì React chạy ở cổng 5173 còn .NET Core chạy ở cổng 5164, nên trong `Program.cs` em đã tạo policy `AllowReactApp` cho phép nguồn `http://localhost:5173` được phép gửi Method, Header và thông tin xác thực lên Backend."*

### Câu 8: `async` và `await` khác gì với gọi hàm đồng bộ thông thường?
> **Trả lời:** *"Dạ, khi gọi đồng bộ, luồng của CPU sẽ bị khóa (block) trong suốt thời gian chờ Database xử lý xong đĩa từ. Còn với `async/await`, luồng CPU được giải phóng ngay lập tức để quay lại phục vụ các yêu cầu của người dùng khác. Khi Database có kết quả, luồng sẽ quay lại thực thi tiếp đoạn code sau từ khóa `await`. Điều này giúp hệ thống không bị nghẽn và chịu tải tốt hơn nhiều."*

### Câu 9: Em xử lý Soft Delete (Xóa mềm) như thế nào trong dự án?
> **Trả lời:** *"Dạ, tất cả Entity đều kế thừa `BaseEntity` có trường `IsDeleted`. Khi bấm xóa, hàm `DeleteAsync` trong Repository chỉ gán `IsDeleted = true`. Trong `ApplicationDbContext.cs`, em cấu hình **Global Query Filter**: `HasQueryFilter(e => !e.IsDeleted)`. Nhờ vậy, mọi câu lệnh truy vấn LINQ sau này đều tự động sinh ra điều kiện `WHERE IsDeleted = 0` trong SQL, lập trình viên không cần lo bị sót dữ liệu đã xóa."*

### Câu 10: Chỉ số Workload Allocation trong phân hệ thống kê có ý nghĩa gì?
> **Trả lời:** *"Dạ, đây là chỉ số phân bổ tải công việc của từng thành viên:
> $$\text{Tỷ lệ phân bổ} = \frac{\text{Số task gán cho thành viên}}{\text{Tổng số task của dự án}} \times 100\%$$
> Chỉ số này giúp Trưởng dự án (PM) quan sát trực quan xem thành viên nào đang bị gánh quá nhiều việc (overload) hoặc ai đang rảnh rỗi để điều chuyển công việc kịp thời, đảm bảo dự án về đích đúng hạn."*

### Câu 11: Phần AI trong hệ thống hoạt động thế nào? Làm sao đảm bảo AI không bịa số liệu?
> **Trả lời:** *"Dạ, em không để AI tự đoán. `AiAssistantService` ở tầng Application tự truy vấn dữ liệu thật của dự án (tổng việc, việc quá hạn, điểm sức khỏe R/A/G do `StatusReportService` tính), ghép thành prompt có cấu trúc rồi mới gửi cho Gemini, kèm chỉ dẫn chỉ được dựa trên dữ liệu cung cấp. Số liệu nền vẫn do hệ thống tính, AI chỉ diễn giải và đề xuất. Riêng gợi ý người nhận việc là thuật toán cân bằng tải thuần, xếp hạng theo số việc đang mở và tổng giờ ước lượng, không gọi AI."*

### Câu 12: Nếu muốn đổi sang nhà cung cấp AI khác, hoặc khi dịch vụ AI bị lỗi thì sao?
> **Trả lời:** *"Dạ, đây là ứng dụng của Dependency Inversion. Tầng Application chỉ biết interface `IAiTextGenerator`, còn `GeminiTextGenerator` ở tầng Infrastructure là bản cài đặt cụ thể. Muốn đổi nhà cung cấp, em viết thêm một lớp cài `IAiTextGenerator` rồi đổi một dòng đăng ký DI, không sửa nghiệp vụ. Khi AI lỗi hoặc chưa cấu hình khóa, lớp này ném `AiUnavailableException`, Controller trả về mã `503` kèm thông báo rõ ràng; các chức năng còn lại của hệ thống vẫn chạy bình thường. Khóa API không nằm trong mã nguồn mà đọc từ biến môi trường hoặc file cấu hình cục bộ."*

### Câu 13: Hệ thống trao đổi thời gian thực (Realtime Communication) được thiết kế thế nào? Làm sao đảm bảo các dự án không bị lẫn tin nhắn của nhau?
> **Trả lời:** *"Dạ, em sử dụng ASP.NET Core SignalR với mô hình Hub-Group:
> 1. Mỗi dự án tương ứng một SignalR Group độc lập mang định danh `projectId`. Khi người dùng mở trang dự án, client gọi `JoinProject(id)` để gia nhập nhóm và `LeaveProject(id)` khi rời đi. Do đó, tin nhắn và sự kiện cập nhật công việc chỉ phát sóng tới các thành viên trong cùng dự án, không bao giờ bị rò rỉ chéo.
> 2. Về kiến trúc, em tuân thủ Dependency Inversion: Tầng Application chỉ định nghĩa `IRealtimeNotificationService`, còn tầng API cài đặt `SignalRRealtimeNotificationService` gọi `IHubContext<ProjectHub>`. Nghiệp vụ không bị dính chặt vào công nghệ SignalR."*

### Câu 14: Vì sao WebSocket cần xử lý xác thực JWT qua query string thay vì Header chuẩn?
> **Trả lời:** *"Dạ, giao thức WebSocket chuẩn của trình duyệt (W3C WebSocket API) không hỗ trợ gắn kèm custom header HTTP như `Authorization: Bearer <token>` trong quá trình bắt tay kết nối (Handshake). Để khắc phục mà vẫn đảm bảo an toàn tuyệt đối, SignalR Client gửi token qua tham số query `?access_token=<jwt>`. Phía backend ASP.NET Core, em cấu hình sự kiện `OnMessageReceived` trong `JwtBearerEvents`: kiểm tra nếu request gửi tới endpoint `/hubs`, hệ thống sẽ trích xuất token từ query string gán vào context để xác thực người dùng bình thường."*

### Câu 15: Thuật toán đường găng (Critical Path Method - CPM) trong đồ án hoạt động thế nào và giải quyết bài toán gì?
> **Trả lời:** *"Dạ, thuật toán CPM là phương pháp toán học kinh điển trong quản lý dự án giúp tìm ra chuỗi công việc quyết định thời gian hoàn thành sớm nhất của toàn bộ dự án:
> 1. **Mô hình hóa quan hệ:** Hệ thống dùng quan hệ Finish-to-Start (FS) kèm kiểm tra chống chu trình (Cycle Detection bằng thuật toán DFS) để đảm bảo đồ thị là một DAG (Directed Acyclic Graph).
> 2. **Giải thuật hai lượt (Two-Pass):**
>    - **Lượt đi xuôi (Forward Pass):** Tính $ES$ (Early Start) và $EF$ (Early Finish) để xác định tổng thời gian dự án $T_{\text{project}}$.
>    - **Lượt đi ngược (Backward Pass):** Tính $LF$ (Late Finish) và $LS$ (Late Start) từ $T_{\text{project}}$ ngược về đầu.
>    - **Độ trôi (Total Float):** $\text{Float} = LS - ES$. Những công việc có $\text{Float} = 0$ chính là **Đường găng (Critical Path)**.
> 3. **Ý nghĩa thực tế:** Giúp người quản lý dự án (PM) biết chính xác những công việc nào tuyệt đối không được trễ hạn (vì trễ 1 ngày là cả dự án trễ 1 ngày), và những công việc nào có thể linh hoạt dời ngày (có Slack) để điều phối nhân sự tối ưu."*

---

> [!NOTE]
> **Lời khuyên cuối cùng:** Hãy mở tài liệu này và đọc lại 1 lần trước giờ báo cáo. Khi trả lời hội đồng, hãy giữ phong thái điềm tĩnh, trả lời từ bức tranh lớn (Kiến trúc & Nghiệp vụ) rồi mới đi vào chi tiết kỹ thuật. Bạn đã làm chủ hoàn toàn dự án này!
