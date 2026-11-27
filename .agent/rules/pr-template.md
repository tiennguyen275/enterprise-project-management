---
description: Quy chuẩn định dạng Pull Request 4 mục tiếng Việt và quy tắc Commit của dự án
globs: "**/*"
---

# Quy Chuẩn Pull Request & Commit (Vietnamese 4-Section Template)

Mọi Pull Request tạo bằng `gh pr create` hoặc chỉnh sửa bằng `gh pr edit` trong repository này **BẮT BUỘC** sử dụng cấu trúc 4 mục tiếng Việt chuẩn sau:

1. `## Công việc (Work)` — Tóm tắt ngắn gọn 1–3 gạch đầu dòng các đầu việc chính đã hoàn thành.
2. `## Lý do (Why)` — Nêu rõ vấn đề/nhu cầu thực tế dẫn đến thay đổi này.
3. `## Những thay đổi (What changed)` — Chia rõ 2 nhánh **Backend:** và **Frontend:** (liệt kê file/module và thay đổi cốt lõi).
4. `## Kiểm thử và xác thực (Validation and proof)` — Liệt kê kết quả thực tế của `dotnet build`, `npx --prefix frontend oxlint`, `npm --prefix frontend run build`, `Test-NoCodeComments.ps1` và 3 vòng review (`R1`, `R2`, `code-review`).

