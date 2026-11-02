# Enterprise Project Management (Hệ Thống Quản Lý Dự Án & Công Việc Doanh Nghiệp)

Đồ án tốt nghiệp xây dựng hệ thống quản lý dự án và công tác trực tuyến cho doanh nghiệp.

## 🛠 Công nghệ sử dụng
- **Backend**: ASP.NET Core Web API (.NET 10) - Clean Architecture (Domain, Application, Infrastructure, Api)
- **Frontend**: ReactJS (Vite, JavaScript thuần)
- **Database**: Microsoft SQL Server
- **Containerization**: Docker & Docker Compose

## 📁 Cấu trúc thư mục
```text
├── backend/                  # ASP.NET Core Clean Architecture
│   ├── EnterpriseProjectManagement.Api
│   ├── EnterpriseProjectManagement.Application
│   ├── EnterpriseProjectManagement.Domain
│   ├── EnterpriseProjectManagement.Infrastructure
│   └── Dockerfile
├── frontend/                 # ReactJS thuần (JavaScript) + Vite
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml        # Docker orchestrator (BE + FE + SQL Server)
└── README.md
```

## 🚀 Khởi chạy cục bộ
### Chạy Backend
```bash
cd backend/EnterpriseProjectManagement.Api
dotnet run
```

### Chạy Frontend
```bash
cd frontend
npm install
npm run dev
```

