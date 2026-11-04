---
name: code-review
description: Thực hiện quy trình Code Review đa tầng (Build Gate, Lint Gate, No-Code-Comments Gate, Round 1 Correctness/Security, Round 2 Clean Architecture & SCSS/UI Scope) trước khi commit hoặc merge nhánh. Sử dụng khi người dùng yêu cầu "review code", "kiểm tra code", hoặc tự động chạy trước khi hoàn tất một tính năng.
---

# Quy Trình Code Review Tự Động (Multi-Gate & 2-Round Review)

Khi thực hiện Code Review cho dự án **Enterprise Project Management**, bắt buộc chạy lần lượt qua **4 Cổng kiểm định tự động (Automated Gates)** và **2 Vòng đánh giá chuyên sâu (Reviewer Rounds)**.

## Bước 1: Chạy 4 Cổng Kiểm Định Tự Động (Automated Gates)

Chạy script kiểm tra tự động tại thư mục gốc của dự án:

```powershell
pwsh -NoProfile -File E:\EnterpriseProjectManagement\tools\Invoke-CodeReview.ps1
```

Script này kiểm tra 4 cổng bắt buộc:
1. **Gate 1 — Backend Build & Warning Gate:** Chạy `dotnet build` cho toàn bộ solution `.NET 10`. Mọi lỗi biên dịch là `Critical`, mọi cảnh báo (`CS*`, `NU*`) là `High`.
2. **Gate 2 — Frontend Lint & Build Gate:** Chạy `npm run lint` (`oxlint`) và `npm run build` (`vite build`). Bắt buộc đạt `Found 0 warnings and 0 errors`.
3. **Gate 3 — No-Code-Comments Gate (`tools/Test-NoCodeComments.ps1`):** Quét toàn bộ các file `.cs`, `.jsx`, `.js`, `.scss`, `.css`, `.ps1`. Không cho phép bất kỳ dòng comment dư thừa nào (`//`, `/* */`, `///`) ngoài các directive của trình biên dịch/linter (như `// eslint-disable-next-line`).
4. **Gate 4 — Clean Repo & Hygiene Gate:** Đảm bảo không còn file nháp `.pr_*` và không rò rỉ tên dự án tham chiếu bên ngoài trong mã nguồn hoặc giao diện.

## Bước 2: Đánh Giá Mã Nguồn Qua 2 Vòng (R1 & R2)

Sau khi vượt qua 4 cổng tự động, đọc `git diff` của các file thay đổi và rà soát theo 2 vòng:

### Vòng 1 (Round 1 - Correctness, Validation & Security)
- **Logic & Dữ liệu:** Kiểm tra các trường hợp biên (`null`, danh sách rỗng, chia cho `0` khi tính phần trăm tiến độ/phân bổ tải).
- **Bảo mật & Phân quyền:** Mọi API thay đổi dữ liệu trong `Controllers/` phải có `[Authorize]` và lấy `UserId` từ JWT Claims, không tin tưởng `UserId` truyền trần từ body nếu không kiểm tra quyền thành viên dự án.
- **Trạng thái React:** Không gọi hàm bất đồng bộ thiếu xử lý lỗi (`try/catch`), không gọi `setState` đồng bộ trực tiếp trong thân `useEffect` hoặc dùng hàm không thuần khiết (`new Date()`) trực tiếp khi render.

### Vòng 2 (Round 2 - Clean Architecture, Maintainability & UI Scope)
- **Ranh giới Clean Architecture:** `Domain` không phụ thuộc tầng nào; `Application` chỉ phụ thuộc `Domain`; `Controllers` chỉ gọi `Services` qua Interface và trả về `DTOs` (tuyệt đối không trả trực tiếp Entity của EF Core ra API).
- **SCSS & Giao diện:** Không viết file `.css` rời rạc ngoài `src/assets/styles/`; khi dùng `-webkit-line-clamp` phải có `line-clamp` đi kèm; màu chữ trên nền sáng phải đảm bảo độ tương phản rõ nét (`#0f172a`).

## Bước 3: Định Dạng Báo Cáo Kết Quả Review

Xuất báo cáo theo đúng định dạng tiếng Việt có dấu đầy đủ:

```markdown
Reviewed files: <danh sách các file đã kiểm tra>
Automated Gates: 4/4 Passed (Backend Build, Frontend Lint/Build, No-Code-Comments, Hygiene)
```

Nếu không có lỗi, in dòng:
`Clean. Không phát hiện lỗi trong các file thay đổi.`

Nếu có lỗi, liệt kê từng lỗi theo cấu trúc:
```markdown
### [Critical|High|Medium] Tiêu đề ngắn gọn của vấn đề
File: relative/path/to/file.ext:lineNumber
Why: Một câu nêu rõ điều kiện kích hoạt lỗi và hậu quả sai lệch.
Fix: Một câu nêu rõ cách sửa cụ thể.
```
