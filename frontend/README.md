# Daycare Management System Frontend Client

Single Page Application for daycare staff operations and the real-time parent portal.

---

## 1. Stack and Package Manifest

### 1.1 Core Runtime
- Runtime: Node.js 20+ (Node 22 LTS or Node 24 recommended)
- Package Manager: npm 10+
- View Framework: React 19 (v19.2.8)
- Build Tool: Vite 8 (v8.3.0)
- Language: TypeScript (~6.0.2)
- Styling: Tailwind CSS v4 (v4.3.3) via `@tailwindcss/vite`
- Linter: Oxlint (v1.81.0)
- Realtime Client: Microsoft SignalR (v10.0.11)
- Routing: React Router DOM v7 (v7.18.4)

### 1.2 Dependencies

| Package | Version | Purpose |
| --- | --- | --- |
| @microsoft/signalr | ^10.0.11 | Realtime WebSocket connection to DaycareHub |
| dotenv | ^18.0.6 | Environment variable support |
| react | ^19.2.8 | User interface components and hooks |
| react-dom | ^19.2.8 | DOM renderer for web |
| react-router-dom | ^7.18.4 | Declarative route matching and navigation |

### 1.3 DevDependencies

| Package | Version | Purpose |
| --- | --- | --- |
| @tailwindcss/vite | ^4.3.3 | Tailwind CSS v4 compilation plugin |
| @types/node | ^24.13.3 | Node.js standard library type definitions |
| @types/react | ^19.2.18 | Type definitions for React |
| @types/react-dom | ^19.2.7 | Type definitions for React DOM |
| @vitejs/plugin-react | ^6.1.1 | React fast refresh and JSX transformation |
| oxlint | ^1.81.0 | Fast static code analysis |
| tailwindcss | ^4.3.3 | Utility CSS framework |
| typescript | ~6.0.2 | Type verification |
| vite | ^8.3.0 | Module bundling and development server |

---

## 2. Local Setup and Commands

### 2.1 Installation
Install dependencies cleanly:
```bash
npm install
```

### 2.2 Development Server
Start the local Vite dev server on port 3001:
```bash
npm run dev
```

### 2.3 Code Quality and Verification
Run static analysis with Oxlint:
```bash
npm run lint
```

Type check and bundle for production:
```bash
npm run build
```

Preview compiled production build:
```bash
npm run preview
```

---

## 3. Directory Layout

- `src/core`: API client, auth context and tokens, theme context, i18n translations, SignalR client.
- `src/components`: Common UI elements (buttons, modals, avatars, stat cards) and layout shells (`AppLayout`, `ParentLayout`).
- `src/modules`: Feature domains:
  - `auth`: Login and password rotation flows.
  - `attendance`: Daily classroom rosters, check-in, and check-out tracking.
  - `children`: Registration, profiles, daily history, allergy badges.
  - `classrooms`: Capacity monitoring, age groups, staff rosters.
  - `staff`: Staff management and account provisioning.
  - `guardians`: Parent records and child linking.
  - `meals`: Food logging, portion metrics, dietary constraints.
  - `daily-activities`: Nap, diaper, learning, and outdoor logs.
  - `incidents`: Incident creation, injury notes, parent signoff.
  - `dashboard`: Operational statistics and attendance summaries.
  - `parent`: Mobile-optimized parent portal, live timeline, digital pickup pass, absence notice.
  - `chat`: Direct communication between parents and staff.
- `public`: Static SVG assets and icons.

---

## 4. Environment Variables

Create `.env` based on `.env.example`:
```env
VITE_API_URL=http://localhost:5107/api
VITE_SIGNALR_URL=http://localhost:5107/hubs/daycare
```
