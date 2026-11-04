---
description: Quy tắc bắt buộc tự động chạy 2 vòng Review (R1, R2) + vòng code-review trước mọi lần Merge hoặc Push
globs: ["**/*"]
---

# Quy Tắc Tự Động Review Trước Khi Merge / Push (Zero-Prompt Review Gate)

Người dùng **không cần** phải gõ lệnh nhắc "chạy code review". Mỗi khi hoàn thành một tính năng, sửa lỗi, hoặc trước khi thực hiện `git merge` / `git push`, AI Agent **BẮT BUỘC** tự động thực thi đúng trình tự 4 bước sau (mô phỏng quy trình `review-talgent` + `commit-talgent`):

1. **Bước 1 — Chuẩn bị & Chạy 4 Cổng Kiểm Định (`prepare`):**
   - Chạy `pwsh -NoProfile -File E:\EnterpriseProjectManagement\tools\Invoke-PrePushReview.ps1 -Action prepare`
   - Script này tự động chạy 4 cổng (`Backend Build 0 warnings`, `Frontend Oxlint & Build`, `Test-NoCodeComments.ps1`, `Clean Repo Hygiene`) và sinh ra 3 file dispatch tại `.git/review-scratch/`: `dispatch-R1.md`, `dispatch-R2.md`, `dispatch-code-review.md`.

2. **Bước 2 — Chạy song song 2 vòng Review độc lập (`R1` và `R2`):**
   - Dùng `invoke_subagent` (loại `research`) khởi chạy đồng thời 2 vòng:
     - **Round 1 (`R1`):** Đọc `.git/review-scratch/dispatch-R1.md` — Kiểm tra logic nghiệp vụ, chia cho 0, null safety, bảo mật `[Authorize]`/JWT, và React state purity.
     - **Round 2 (`R2`):** Đọc `.git/review-scratch/dispatch-R2.md` — Kiểm tra kiến trúc Clean Architecture, không dùng comment dư thừa, phạm vi SCSS và quy chuẩn Impeccable UI.
   - Đợi cả `R1` và `R2` trả kết quả về trước khi sang Bước 3.

3. **Bước 3 — Chạy vòng `code-review` độc lập (sau khi R1 & R2 hoàn tất):**
   - Dùng `invoke_subagent` (loại `research`) đọc `.git/review-scratch/dispatch-code-review.md` để kiểm tra chéo lần cuối (bugs, dư thừa logic, xác nhận `Reviewed files:`).
   - Nếu `R1`, `R2` hoặc `code-review` phát hiện bất kỳ lỗi nào (`Critical`, `High`, `Medium`), sửa ngay trên nhánh hiện tại, commit lại và chạy lại từ Bước 1 cho tới khi `0 findings`.

4. **Bước 4 — Đóng dấu xác nhận (`stamp`) để mở khóa Git Hook `pre-push`:**
   - Chạy `pwsh -NoProfile -File E:\EnterpriseProjectManagement\tools\Invoke-PrePushReview.ps1 -Action stamp -Rounds "R1,R2,code-review"`
   - Git Hook `.githooks/pre-push` sẽ tự động kiểm tra chữ ký SHA trong `.git/review-stamp.json` và chặn mọi lệnh `git push` nếu chưa chạy đủ 3 vòng `R1,R2,code-review`.
