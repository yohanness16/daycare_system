# Daycare Management System & Parent Portal

A full-stack, enterprise daycare management platform built with a .NET 10 Clean Architecture backend, real-time SignalR notifications, PostgreSQL persistence, and a modern React 19 / Vite / Tailwind CSS responsive frontend.

---

## 1. Documentation Index

- API Reference Specification: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
  Contains complete endpoint schemas, parameters, JWT authentication contracts, and SignalR hub protocols.
- Developer and Operations Guide: [docs/GUIDE_DOCUMENTATION.md](docs/GUIDE_DOCUMENTATION.md)
  Detailed system architecture, database setup, environment management via `dev.sh`, test procedures, and Docker deployment.
- Frontend Client Guide: [frontend/README.md](frontend/README.md)
  React 19 client setup, routing, state management, and component hierarchy.

---

## 2. Technology Stack and Versions

### 2.1 Core Runtime Versions
- Backend SDK: .NET 10.0 (C# 13, ASP.NET Core 10 Web API)
- Database: PostgreSQL 16 (Npgsql provider for EF Core)
- Frontend Engine: Node.js 22 LTS / Node 24, npm 11
- UI Framework: React 19 (v19.2.8), React DOM (v19.2.8)
- Build Bundler: Vite 8 (v8.3.0)
- Language & Typings: TypeScript (~6.0.2)
- Styling: Tailwind CSS v4 (v4.3.3) via `@tailwindcss/vite`
- Static Analysis: Oxlint (v1.81.0)
- Realtime Protocol: ASP.NET Core SignalR / @microsoft/signalr (v10.0.11)
- Containerization: Docker 26+, Docker Compose v2

### 2.2 Backend NuGet Package Manifest

| Project | Package Identifier | Version | Description |
| --- | --- | --- | --- |
| Daycare.Api | Microsoft.AspNetCore.Authentication.JwtBearer | 10.0.12 | JWT bearer middleware authentication |
| Daycare.Api | Microsoft.AspNetCore.OpenApi | 10.0.12 | OpenAPI document generation |
| Daycare.Api | Microsoft.EntityFrameworkCore.Design | 10.0.12 | Design-time migration tools |
| Daycare.Api | Swashbuckle.AspNetCore | 10.2.3 | Swagger interactive documentation UI |
| Daycare.Application | Microsoft.EntityFrameworkCore | 10.0.12 | EF Core abstractions for query composition |
| Daycare.Infrastructure | Microsoft.AspNetCore.Identity.EntityFrameworkCore | 10.0.12 | Identity user and role persistence |
| Daycare.Infrastructure | Microsoft.EntityFrameworkCore | 10.0.12 | Object-relational mapping engine |
| Daycare.Infrastructure | Npgsql.EntityFrameworkCore.PostgreSQL | 10.0.3 | PostgreSQL database provider |
| Daycare.Infrastructure | System.IdentityModel.Tokens.Jwt | 8.19.2 | Token generation, validation, and decoding |
| Daycare.Application.Tests | Microsoft.EntityFrameworkCore.InMemory | 10.0.12 | In-memory context for service tests |
| Daycare.Application.Tests | Microsoft.NET.Test.Sdk | 17.13.0 | Test runner execution engine |
| Daycare.Application.Tests | xunit | 2.9.3 | Unit test assertion framework |
| Daycare.Application.Tests | xunit.runner.visualstudio | 3.0.2 | Visual Studio test runner adapter |
| Daycare.Api.Tests | Microsoft.AspNetCore.Authentication.JwtBearer | 10.0.12 | Auth test verification |
| Daycare.Api.Tests | Microsoft.EntityFrameworkCore.InMemory | 10.0.12 | In-memory database context for API tests |
| Daycare.Api.Tests | Microsoft.NET.Test.Sdk | 17.13.0 | Test SDK harness |
| Daycare.Api.Tests | xunit | 2.9.3 | Integration test framework |
| Daycare.Api.Tests | xunit.runner.visualstudio | 3.0.2 | Test adapter |

### 2.3 Frontend NPM Package Manifest

| Package Name | Version | Type | Function |
| --- | --- | --- | --- |
| @microsoft/signalr | ^10.0.11 | dependency | Realtime SignalR WebSocket client |
| dotenv | ^18.0.6 | dependency | Runtime environment variable loading |
| react | ^19.2.8 | dependency | Core React component engine |
| react-dom | ^19.2.8 | dependency | Web DOM rendering target |
| react-router-dom | ^7.18.4 | dependency | Client-side routing and layout rendering |
| @tailwindcss/vite | ^4.3.3 | devDependency | Tailwind CSS v4 Vite compiler plugin |
| @types/node | ^24.13.3 | devDependency | Node.js system type declarations |
| @types/react | ^19.2.18 | devDependency | React type declarations |
| @types/react-dom | ^19.2.7 | devDependency | React DOM type declarations |
| @vitejs/plugin-react | ^6.1.1 | devDependency | Vite React compiler plugin |
| oxlint | ^1.81.0 | devDependency | High-speed static analysis linter |
| tailwindcss | ^4.3.3 | devDependency | Utility-first CSS styling engine |
| typescript | ~6.0.2 | devDependency | Static type checker |
| vite | ^8.3.0 | devDependency | Development server and production bundler |

---

## 3. Solution Architecture

The solution uses Clean Architecture to enforce separation of concerns and dependency isolation:

```
Daycare/
  Daycare.slnx                                 # Visual Studio .NET 10 solution file
  docker-compose.yml                           # PostgreSQL 16 container definition
  Dockerfile                                   # Multi-stage production container
  src/
    Daycare.Domain/                            # Enterprise business entities, domain exceptions
    Daycare.Application/                       # Features, DTOs, interfaces, staff resolvers
    Daycare.Infrastructure/                    # DbContext, Identity, Npgsql migrations, JWT tokens
    Daycare.Api/                               # 15 REST controllers, SignalR hub, middleware
  tests/
    Daycare.Application.Tests/                 # Unit tests (14 passing)
    Daycare.Api.Tests/                         # Integration tests (64 passing)
frontend/
  package.json                                 # Dependencies, scripts, and build targets
  vite.config.ts                               # Vite 8 and Tailwind CSS v4 configuration
  src/
    core/                                      # API client, AuthContext, i18n, SignalR service
    components/                                # Shared UI components and layout wrappers
    modules/                                   # Domain modules (children, staff, parent, etc.)
docs/
  API_DOCUMENTATION.md                         # Complete endpoint catalog and payloads
  GUIDE_DOCUMENTATION.md                       # Comprehensive setup, operations, and deployment
.github/
  workflows/
    backend-ci.yml                             # .NET 10 restore, build, and test pipeline
    frontend-ci.yml                            # Node.js 22 lint, typecheck, and build pipeline
dev.sh                                         # Integrated local development manager script
```

---

## 4. Quick Start

### 4.1 Automated Startup via `dev.sh`
The fastest way to run all services locally is via the development manager script:
```bash
# Start PostgreSQL, .NET backend, and Vite frontend in the background
./dev.sh start

# Check running processes and bound ports
./dev.sh status

# Follow logs from all running processes
./dev.sh logs

# Stop all processes gracefully
./dev.sh stop
```

### 4.2 Manual Startup
Alternatively, run each tier independently:

1. Launch PostgreSQL:
```bash
cd Daycare
docker compose up -d
cd ..
```

2. Run Backend API:
```bash
dotnet run --project Daycare/src/Daycare.Api
```
The API is available at `http://localhost:5107` and Swagger at `http://localhost:5107/swagger`.

3. Run Frontend:
```bash
cd frontend
npm install
npm run dev
```
The application is available at `http://localhost:3001`.

### 4.3 Default Administrator Credentials
- Email: `admin@daycare.local`
- Password: `Admin@Daycare2026!`
- Role: `Admin`

---

## 5. Automated Testing and Code Quality

### 5.1 Backend Test Execution
All 78 unit and integration tests run against Release configuration:
```bash
dotnet test Daycare/Daycare.slnx -c Release --verbosity normal
```

Test Results Breakdown:
- `Daycare.Application.Tests`: 14 passed, 0 failed.
- `Daycare.Api.Tests`: 64 passed, 0 failed.
- Total: 78 passed, 0 failed, 0 skipped.

### 5.2 Frontend Lint and Build Verification
Verify static analysis and compile production assets:
```bash
cd frontend
npm run lint
npm run build
```

---

## 6. Continuous Integration

Both test suites are automated via GitHub Actions:
- Backend Workflow (`.github/workflows/backend-ci.yml`): Runs on Ubuntu Latest with .NET 10 SDK, restores dependencies, builds in Release mode, and runs all 78 tests.
- Frontend Workflow (`.github/workflows/frontend-ci.yml`): Runs on Ubuntu Latest with Node.js 22, executes Oxlint static analysis, verifies TypeScript types, and compiles production assets with Vite.
