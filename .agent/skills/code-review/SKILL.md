---
name: code-review
description: Quy trình tự động chạy 4 cổng kiểm định (Build, Lint, No-Code-Comments, Hygiene), tiếp theo là 2 vòng Review độc lập (R1, R2) và vòng code-review cuối cùng kèm đóng dấu SHA (stamp) trước khi merge/push.
---

# Quy Trình Code Review Đa Vòng Tự Động (`R1 + R2 -> code-review -> Stamp`)

Quy trình này được kích hoạt **tự động** trước mỗi lần gộp nhánh (`git merge`) hoặc đẩy code (`git push`), đồng thời được bảo vệ cứng bởi Git Hook `.githooks/pre-commit` và `.githooks/pre-push`.

## 1. Kiến trúc 3 tầng bảo vệ tự động (Không cần gõ lệnh thủ công)

1. **Git Hook `.githooks/pre-commit`:**
   - Tự động chạy `tools/Test-NoCodeComments.ps1` mỗi khi thực hiện `git commit`. Nếu phát hiện bất kỳ dòng comment thừa nào (`//`, `/* */`, `///`), lệnh commit bị chặn ngay lập tức.
2. **Git Hook `.githooks/pre-push`:**
   - Tự động gọi `tools/Invoke-PrePushReview.ps1 -Action verify` mỗi khi thực hiện `git push`.
   - Kiểm tra file `.git/review-stamp.json` xem mã băm `HEAD` hiện tại đã chạy đủ 2 vòng `R1`, `R2` và vòng `code-review` chưa. Nếu thiếu bất kỳ vòng nào hoặc commit mới chưa được review lại, `git push` sẽ bị từ chối.
3. **Rule tự động cho AI Agent (`.agent/rules/pre-push-review.md`):**
   - Ràng buộc AI Agent luôn chạy quy trình `prepare -> R1 & R2 -> code-review -> stamp` trước khi hoàn tất công việc.

## 2. Trình tự thực thi chi tiết

### Bước 1: Prepare & Automated Gates
```powershell
pwsh -NoProfile -File E:\EnterpriseProjectManagement\tools\Invoke-PrePushReview.ps1 -Action prepare
```
- Chạy 4 cổng tự động (`Invoke-CodeReview.ps1`).
- Trích xuất bản diff vào `.git/review-scratch/diff.patch` và sinh 3 file điều phối:
  - `.git/review-scratch/dispatch-R1.md`
  - `.git/review-scratch/dispatch-R2.md`
  - `.git/review-scratch/dispatch-code-review.md`

### Bước 2: Khởi chạy song song Round 1 (`R1`) và Round 2 (`R2`)
Sử dụng công cụ `invoke_subagent` (`TypeName: "research"`) gọi song song 2 subagent:
- **Subagent R1 (Correctness & Security):** Đọc `dispatch-R1.md` và kiểm tra lỗi logic, chia cho 0, null reference, bảo mật JWT `[Authorize]`, React hooks purity.
- **Subagent R2 (Architecture & UI Scope):** Đọc `dispatch-R2.md` và kiểm tra ranh giới Clean Architecture, cấm trả Entity trực tiếp, không có comment thừa, chuẩn SCSS & Impeccable UI.

### Bước 3: Khởi chạy vòng `code-review` (Sau khi R1 và R2 hoàn tất)
Sau khi cả `R1` và `R2` trả kết quả:
- Gọi `invoke_subagent` (`TypeName: "research"`) đọc `dispatch-code-review.md`.
- Vòng này kiểm tra độc lập toàn bộ diff để tìm lỗi logic còn sót và cơ hội tối ưu/rút gọn code, bắt buộc mở đầu bằng dòng `Reviewed files: <danh sách file>`.

### Bước 4: Xử lý lỗi (Fix Loop) & Đóng dấu (`Stamp`)
- Nếu có bất kỳ finding nào từ `R1`, `R2` hoặc `code-review`, tiến hành sửa lỗi, commit lại và lặp lại từ Bước 1.
- Khi cả 3 vòng đều sạch (`Clean / No findings`), đóng dấu xác nhận cho `HEAD` hiện tại:
```powershell
pwsh -NoProfile -File E:\EnterpriseProjectManagement\tools\Invoke-PrePushReview.ps1 -Action stamp -Rounds "R1,R2,code-review"
```
Lúc này `.git/review-stamp.json` được ghi nhận hợp lệ (nằm trong `.git/` nên không làm lộ dấu vết bot lên GitHub) và mở khóa cho phép `git push`.
