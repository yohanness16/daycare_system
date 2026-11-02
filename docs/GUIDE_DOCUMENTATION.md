# Daycare Management System Developer and Operational Guide

Version: 2.0.0
Architecture: Clean Architecture .NET 10 Monorepo with React 19 Single Page Application
Target Platforms: Linux, macOS, Windows (Containerized via Docker)

---

## 1. System Overview and Architectural Layers

The Daycare Management System is an enterprise software platform designed to manage daycare administrative operations, daily childcare tracking, staff coordination, and real-time parent engagement.

```
+-----------------------------------------------------------------------------------------+
|                                    Daycare Monorepo                                     |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [ Frontend (React 19 + TypeScript + Vite 8) ]                                          |
|    - Core: Auth, Theme, i18n, SignalR, API Client                                      |
|    - Staff & Admin Portal: Classrooms, Children, Attendance, Meals, Activities, Staff   |
|    - Parent Portal: Live child timeline, wellbeing gauge, pickup passes, chat          |
|                                                                                         |
|                                 | HTTP / REST (JSON) + WebSocket (SignalR)              |
|                                 v                                                       |
|                                                                                         |
|  [ Backend API Host (Daycare.Api - ASP.NET Core 10) ]                                   |
|    - REST Controllers & SignalR Hub (/hubs/daycare)                                     |
|    - Global Exception Middleware, Swagger OpenAPI, JWT Auth Filters                     |
|                                                                                         |
|                                 | References                                            |
|                                 v                                                       |
|                                                                                         |
|  [ Application Layer (Daycare.Application) ]                                            |
|    - Feature Services: Attendance, Auth, Children, Classrooms, Meals, Incidents, Parent  |
|    - DTOs, Service Contracts, Staff Claims Resolvers                                    |
|                                                                                         |
|                   | References                         | References                     |
|                   v                                    v                                |
|                                                                                         |
|  [ Infrastructure Layer (Daycare.Infrastructure) ]     [ Domain Layer (Daycare.Domain)] |
|    - EF Core DbContext & Migrations                    - Core POCO Entities             |
|    - ASP.NET Core Identity (ApplicationUser)           - Domain Enums & Value Objects   |
|    - PostgreSQL Provider (Npgsql)                      - Domain Exceptions              |
|    - JWT Token Generation & Refresh Handling                                            |
|                                                                                         |
|                                 | Reads / Writes                                        |
|                                 v                                                       |
|                                                                                         |
|  [ Database (PostgreSQL 16) ]                                                           |
|    - Relational tables, Foreign Key cascading, Unique constraints                       |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

### 1.1 Backend Clean Architecture Structure
1. `Daycare.Domain`:
   - Contains core business entities (`Child`, `Guardian`, `Classroom`, `Attendance`, `Meal`, `DailyActivity`, `IncidentReport`, `Staff`, `Conversation`, `ChatMessage`).
   - Defines system constants and domain exception types (`DaycareApiException`).
   - Zero dependencies on external frameworks or databases.

2. `Daycare.Application`:
   - Contains application use-cases, feature services, and business rules.
   - Houses Request/Response Data Transfer Objects (DTOs).
   - Defines abstraction interfaces (`IDaycareDbContext`, `IAuthService`, `IParentAccessService`, `ICurrentUserService`).
   - Implements automated staff identity resolution (`StaffResolver`) bridging JWT claims to domain records.

3. `Daycare.Infrastructure`:
   - Implements data persistence using Entity Framework Core 10 and Npgsql PostgreSQL provider.
   - Implements identity management using ASP.NET Core Identity (`ApplicationUser`, `ApplicationRole`).
   - Manages database schema migrations and model snapshots.
   - Provides JWT generation and refresh token handling (`TokenService`).

4. `Daycare.Api`:
   - Entry point for the ASP.NET Core application host (`Program.cs`).
   - Exposes 15 REST API controllers and the real-time SignalR hub (`DaycareHub`).
   - Implements global error handling middleware translating exceptions to RFC 7807 ProblemDetails.
   - Configures Swagger documentation and CORS policies.

### 1.2 Frontend Architecture Structure
1. `frontend/src/core`:
   - Authentication context (`AuthContext`) and custom hooks (`useAuth`).
   - API client module with automatic Bearer token injection and 401 interceptors.
   - Real-time SignalR service (`signalrService`) managing connection lifecycles and event dispatching.
   - Theme provider (light/dark mode) and internationalization engine (`LanguageContext`) supporting English and Amharic.

2. `frontend/src/components`:
   - Reusable UI component library (`Button`, `Modal`, `Avatar`, `Badge`, `CapacityBar`, `StatCard`, `SearchField`).
   - Layout shells: `AppLayout` for staff and administration, `ParentLayout` for mobile-first parent portal.

3. `frontend/src/modules`:
   - Modular feature packaging:
     - `auth`: Login and forced initial password rotation.
     - `children`: Registration, medical/allergy profiles, daily history timelines.
     - `classrooms`: Capacity tracking, student lists, staff assignments.
     - `staff`: Staff directory, role management, account provisioning.
     - `guardians`: Parent/guardian records and emergency contact mappings.
     - `attendance`: Single-tap check-in, check-out, live classroom rosters.
     - `meals`: Breakfast, lunch, and snack portion logging.
     - `daily-activities`: Sleep logs, bathroom/diaper tracking, learning milestones.
     - `incidents`: Safety reporting, injury logs, parent acknowledgment workflows.
     - `dashboard`: Center-wide statistics, attendance trends, daily reporting.
     - `parent`: Live child status cards, daily story, absence reporting, digital pickup pass, chat.
     - `chat`: Direct bidirectional messaging between parents and daycare personnel.

---

## 2. Technology Stack, Versions, and Package Dependencies

### 2.1 Software and Runtime Requirements

| Dependency | Required Version | Status |
| --- | --- | --- |
| .NET SDK | 10.0 (v10.0.401 or later) | Installed |
| Node.js | v20.x or v22.x or v24.x (v24.13.1 confirmed) | Installed |
| npm | 10.x or 11.x (v11.8.0 confirmed) | Installed |
| Docker Engine | 24.x or later | Required for database |
| Docker Compose | v2.x or later | Required for orchestration |
| PostgreSQL | 16-alpine (containerized) | Provided in compose |

### 2.2 Backend Package Dependencies (.NET 10)

| Project | Package ID | Version |
| --- | --- | --- |
| Daycare.Api | Microsoft.AspNetCore.Authentication.JwtBearer | 10.0.12 |
| Daycare.Api | Microsoft.AspNetCore.OpenApi | 10.0.12 |
| Daycare.Api | Microsoft.EntityFrameworkCore.Design | 10.0.12 |
| Daycare.Api | Swashbuckle.AspNetCore | 10.2.3 |
| Daycare.Application | Microsoft.EntityFrameworkCore | 10.0.12 |
| Daycare.Infrastructure | Microsoft.AspNetCore.Identity.EntityFrameworkCore | 10.0.12 |
| Daycare.Infrastructure | Microsoft.EntityFrameworkCore | 10.0.12 |
| Daycare.Infrastructure | Npgsql.EntityFrameworkCore.PostgreSQL | 10.0.3 |
| Daycare.Infrastructure | System.IdentityModel.Tokens.Jwt | 8.19.2 |
| Daycare.Application.Tests | Microsoft.EntityFrameworkCore.InMemory | 10.0.12 |
| Daycare.Application.Tests | Microsoft.NET.Test.Sdk | 17.13.0 |
| Daycare.Application.Tests | xunit | 2.9.3 |
| Daycare.Application.Tests | xunit.runner.visualstudio | 3.0.2 |
| Daycare.Api.Tests | Microsoft.AspNetCore.Authentication.JwtBearer | 10.0.12 |
| Daycare.Api.Tests | Microsoft.EntityFrameworkCore.InMemory | 10.0.12 |
| Daycare.Api.Tests | Microsoft.NET.Test.Sdk | 17.13.0 |
| Daycare.Api.Tests | xunit | 2.9.3 |
| Daycare.Api.Tests | xunit.runner.visualstudio | 3.0.2 |

### 2.3 Frontend Package Dependencies (React 19 / Vite 8)

| Package Name | Version | Role |
| --- | --- | --- |
| @microsoft/signalr | ^10.0.11 | Realtime SignalR WebSocket client |
| dotenv | ^18.0.6 | Environment variable management |
| react | ^19.2.8 | Core React UI library |
| react-dom | ^19.2.8 | React DOM rendering target |
| react-router-dom | ^7.18.4 | Client-side routing engine |
| @tailwindcss/vite | ^4.3.3 | Tailwind CSS v4 compiler for Vite |
| @types/node | ^24.13.3 | TypeScript declarations for Node.js |
| @types/react | ^19.2.18 | TypeScript definitions for React |
| @types/react-dom | ^19.2.7 | TypeScript definitions for React DOM |
| @vitejs/plugin-react | ^6.1.1 | Vite plugin for React JSX compilation |
| oxlint | ^1.81.0 | Fast static analysis and linting engine |
| tailwindcss | ^4.3.3 | Atomic styling engine |
| typescript | ~6.0.2 | Static type checker |
| vite | ^8.3.0 | Module bundler and development server |

---

## 3. Local Development Setup

### 3.1 Initial Repository Preparation
Clone the repository and inspect the workspace:
```bash
git clone git@github.com:yohanness16/daycare_system.git
cd daycare_system
```

### 3.2 Starting PostgreSQL Database
The backend relies on PostgreSQL 16 running on port 5432. You can launch the official container using Docker Compose:
```bash
cd Daycare
docker compose up -d
cd ..
```

Default Database Configuration:
- Host: `localhost`
- Port: `5432`
- Database: `daycare_db`
- Username: `daycare_user`
- Password: `daycare_password_2026`
- Connection String: `Host=localhost;Port=5432;Database=daycare_db;Username=daycare_user;Password=daycare_password_2026`

### 3.3 Database Migrations and Seeding
Migrations run automatically upon application startup when executing in the Development environment (`IdentityDataSeeder.cs`). To apply migrations manually via CLI:
```bash
dotnet ef database update \
  --project Daycare/src/Daycare.Infrastructure \
  --startup-project Daycare/src/Daycare.Api
```

Default Pre-seeded Accounts:
- Administrator: `admin@daycare.local` / `Admin@Daycare2026!`
- Role: `Admin`

### 3.4 Running the Backend Web API
To launch the backend API server:
```bash
dotnet run --project Daycare/src/Daycare.Api
```
The API listens on:
- HTTP: `http://localhost:5107`
- Swagger Documentation: `http://localhost:5107/swagger`
- Realtime SignalR Hub: `http://localhost:5107/hubs/daycare`

### 3.5 Running the Frontend Application
In a separate terminal, install dependencies and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be accessible at:
- Web Application: `http://localhost:3001`

---

## 4. Development Manager Script (`dev.sh`)

A unified shell script (`./dev.sh`) is provided in the root directory to orchestrate PostgreSQL, the .NET backend, and the React frontend simultaneously.

```bash
# Display help and command syntax
./dev.sh help

# Start database, backend, and frontend concurrently
./dev.sh start

# Verify running services and bound ports
./dev.sh status

# Follow logs from all running processes
./dev.sh logs

# Follow logs from a single service (backend, frontend, or db)
./dev.sh logs backend
./dev.sh logs frontend
./dev.sh logs db

# Gracefully terminate all processes and containers
./dev.sh stop

# Restart all services
./dev.sh restart

# Reset and re-seed the local PostgreSQL database
./dev.sh reset-db
```

The script manages runtime PIDs in `.pids/` and writes background output to `logs/backend.log` and `logs/frontend.log`.

---

## 5. Verification and Testing

### 5.1 Backend Test Suites (xUnit)
The backend test suite includes 78 unit and integration tests covering:
- In-memory database context validation
- Token creation, expiration, and claims extraction
- Staff soft-deletion and deactivation state machine
- Child health profiles and allergy cascading
- Authorization boundaries across Admin, Staff, and Parent roles
- Daily history aggregation queries

To execute all backend tests:
```bash
dotnet test Daycare/Daycare.slnx --configuration Release --verbosity normal
```

Expected result:
```
Passed!  - Failed: 0, Passed: 14, Skipped: 0, Total: 14 - Daycare.Application.Tests.dll
Passed!  - Failed: 0, Passed: 64, Skipped: 0, Total: 64 - Daycare.Api.Tests.dll
Total Test Runs: 78 passed, 0 failed.
```

### 5.2 Frontend Linting (Oxlint)
Oxlint runs static analysis across all TypeScript and TSX files in the frontend:
```bash
cd frontend
npm run lint
```
Expected result: 0 errors.

### 5.3 Frontend Type Check and Production Bundling (Vite)
To verify TypeScript compilation and build production assets:
```bash
cd frontend
npm run build
```
Production output is emitted to `frontend/dist/`.

---

## 6. Containerization and Production Deployment

### 6.1 Backend Docker Container
The backend Docker image is built from `Daycare/Dockerfile`:
```bash
# Publish compiled output
dotnet publish Daycare/src/Daycare.Api/Daycare.Api.csproj -c Release -o Daycare/app_publish

# Build container image
docker build -t daycare-api:latest -f Daycare/Dockerfile Daycare/

# Run API container
docker run -d \
  -p 5107:5107 \
  -e ConnectionStrings__DefaultConnection="Host=postgres-host;Port=5432;Database=daycare_db;Username=daycare_user;Password=daycare_password_2026" \
  -e JwtSettings__Secret="YourSecureProductionJwtSecretKeyAtLeast32BytesLong2026!" \
  --name daycare-api \
  daycare-api:latest
```

### 6.2 Frontend Docker Container
The frontend Docker image is built from `frontend/Dockerfile`:
```bash
cd frontend
docker build -t daycare-frontend:latest .
docker run -d -p 3001:3001 --name daycare-frontend daycare-frontend:latest
```

---

## 7. Continuous Integration and Continuous Deployment (CI/CD)

Automated testing and build verification are managed using GitHub Actions located in `.github/workflows/`.

### 7.1 Backend Pipeline (`.github/workflows/backend-ci.yml`)
- Trigger: Push and Pull Request events to `main` branch.
- Environment: Ubuntu latest runner with .NET 10.0.x SDK.
- Pipeline Steps:
  1. Checks out repository source code.
  2. Sets up .NET 10 SDK environment.
  3. Restores NuGet dependencies for `Daycare/Daycare.slnx`.
  4. Builds all solution projects in Release mode without warnings-as-errors blockers.
  5. Runs all 78 unit and integration tests with detailed console reporting.

### 7.2 Frontend Pipeline (`.github/workflows/frontend-ci.yml`)
- Trigger: Push and Pull Request events to `main` branch.
- Environment: Ubuntu latest runner with Node.js 22.
- Pipeline Steps:
  1. Checks out repository source code.
  2. Sets up Node.js 22 with npm dependency caching.
  3. Installs clean package dependencies via `npm ci`.
  4. Executes Oxlint static analysis.
  5. Performs TypeScript static verification and produces minified production bundle via Vite.
