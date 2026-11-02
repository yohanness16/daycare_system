# Daycare Management System API Specification

Version: 2.0.0
Base URL: http://localhost:5107/api
SignalR Hub URL: http://localhost:5107/hubs/daycare
Swagger OpenAPI: http://localhost:5107/swagger/v1/swagger.json
Default Administrator: admin@daycare.local / Admin@Daycare2026!

---

## 1. Runtime Versions and Package Manifest

### 1.1 Backend Runtime and Core Technologies
- Target Framework: .NET 10.0 (net10.0)
- Language: C# 13
- Database Engine: PostgreSQL 16 (Npgsql provider)
- Identity Provider: ASP.NET Core Identity with EF Core
- Authentication Standard: JWT Bearer Token (HMAC SHA-256)
- Realtime Transport: ASP.NET Core SignalR (WebSocket / Long Polling fallback)

### 1.2 Backend NuGet Package Manifest
The following package dependencies are utilized across the backend solution projects:

| Project | Package ID | Version | Purpose |
| --- | --- | --- | --- |
| Daycare.Api | Microsoft.AspNetCore.Authentication.JwtBearer | 10.0.12 | JWT bearer authentication middleware |
| Daycare.Api | Microsoft.AspNetCore.OpenApi | 10.0.12 | OpenAPI document generation |
| Daycare.Api | Microsoft.EntityFrameworkCore.Design | 10.0.12 | EF Core design-time tools for migrations |
| Daycare.Api | Swashbuckle.AspNetCore | 10.2.3 | Swagger UI documentation endpoints |
| Daycare.Application | Microsoft.EntityFrameworkCore | 10.0.12 | Core abstractions for queries and context |
| Daycare.Infrastructure | Microsoft.AspNetCore.Identity.EntityFrameworkCore | 10.0.12 | Identity stores integration with PostgreSQL |
| Daycare.Infrastructure | Microsoft.EntityFrameworkCore | 10.0.12 | ORM database mapping and execution |
| Daycare.Infrastructure | Npgsql.EntityFrameworkCore.PostgreSQL | 10.0.3 | PostgreSQL provider for EF Core 10 |
| Daycare.Infrastructure | System.IdentityModel.Tokens.Jwt | 8.19.2 | Token generation, validation, and decoding |
| Daycare.Application.Tests | Microsoft.EntityFrameworkCore.InMemory | 10.0.12 | In-memory database context for unit tests |
| Daycare.Application.Tests | Microsoft.NET.Test.Sdk | 17.13.0 | Visual Studio test execution harness |
| Daycare.Application.Tests | xunit | 2.9.3 | Unit test framework engine |
| Daycare.Application.Tests | xunit.runner.visualstudio | 3.0.2 | Test discovery and test runner adapter |
| Daycare.Api.Tests | Microsoft.AspNetCore.Authentication.JwtBearer | 10.0.12 | Test auth integration verification |
| Daycare.Api.Tests | Microsoft.EntityFrameworkCore.InMemory | 10.0.12 | In-memory database context for API tests |
| Daycare.Api.Tests | Microsoft.NET.Test.Sdk | 17.13.0 | API test execution harness |
| Daycare.Api.Tests | xunit | 2.9.3 | API integration test framework |
| Daycare.Api.Tests | xunit.runner.visualstudio | 3.0.2 | Test runner adapter |

### 1.3 Frontend Client Package Manifest
The following dependencies are used by the React client application:

| Package | Version | Type | Function |
| --- | --- | --- | --- |
| react | ^19.2.8 | dependency | Application view layer |
| react-dom | ^19.2.8 | dependency | DOM rendering engine |
| react-router-dom | ^7.18.4 | dependency | Client-side routing and layout rendering |
| @microsoft/signalr | ^10.0.11 | dependency | Realtime SignalR client library |
| dotenv | ^18.0.6 | dependency | Client environment variable support |
| vite | ^8.3.0 | devDependency | Development server and build bundler |
| typescript | ~6.0.2 | devDependency | Static type checker |
| @types/react | ^19.2.18 | devDependency | React type definitions |
| @types/react-dom | ^19.2.7 | devDependency | React DOM type definitions |
| @types/node | ^24.13.3 | devDependency | Node.js system type definitions |
| @vitejs/plugin-react | ^6.1.1 | devDependency | Babel/SWC Fast Refresh plugin |
| tailwindcss | ^4.3.3 | devDependency | Utility-first CSS framework |
| @tailwindcss/vite | ^4.3.3 | devDependency | Tailwind CSS v4 compiler for Vite |
| oxlint | ^1.81.0 | devDependency | High-performance linter |

---

## 2. Authentication, Roles, and Request Lifecycle

### 2.1 Transport and Data Protocols
- Request and response payloads use JSON (application/json) formatted with camelCase properties.
- Date and time values are serialized in ISO 8601 UTC format: `YYYY-MM-DDTHH:mm:ss.sssZ`.
- Plain calendar dates use `YYYY-MM-DD`.

### 2.2 Security Architecture and JWT Bearer Tokens
Protected endpoints require an Authorization header containing a valid Bearer token:
```http
Authorization: Bearer <jwt-token>
```

Tokens encode the following standard claims:
- `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier`: Unique User GUID (ApplicationUser.Id)
- `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/email`: User email address
- `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`: Assigned role (Admin, Staff, Parent)
- `exp`: Expiration Unix epoch timestamp (default lifespan: 60 minutes)

### 2.3 User Roles and Isolation
- `Admin`: Full read and write access across all system entities, settings, and staff operations.
- `Staff`: Daily operational access to attendance records, meal entries, daily logs, incident reports, and classroom assignments.
- `Parent`: Restricted strictly to children linked to the authenticated guardian profile. Queries filter out records for children not explicitly associated with the guardian.

### 2.4 Error Response Standard (RFC 7807)
Errors return a standard ProblemDetails response body:
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Child is already enrolled in this classroom.",
  "instance": "/api/enrollments"
}
```

Common status codes:
- `200 OK`: Request succeeded with returned body.
- `201 Created`: Resource successfully created. Location header contains resource URI.
- `204 No Content`: Action succeeded with empty response body.
- `400 Bad Request`: Validation failure or business constraint violation.
- `401 Unauthorized`: Missing or invalid Bearer token.
- `403 Forbidden`: Authenticated user role lacks permission for the endpoint.
- `404 Not Found`: Target entity ID does not exist.
- `409 Conflict`: Unique constraint violation (e.g., duplicate enrollment or email).
- `500 Internal Server Error`: Unhandled server exception.

---

## 3. API Endpoint Catalog

### 3.1 Authentication Controller (`/api/auth`)

#### POST /api/auth/login
Authenticates a user and returns JWT access token and refresh token.
- Authorization: Public
- Request Body:
```json
{
  "email": "staff@daycare.local",
  "password": "Password123!"
}
```
- Response (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1Ni...",
  "refreshToken": "4a71b2c3-9f8e...",
  "expiresAt": "2026-11-02T13:30:00Z",
  "mustChangePassword": true,
  "user": {
    "id": "c1f7b0f4-508b-4a37-b6e1-b4ecde8c2310",
    "email": "staff@daycare.local",
    "fullName": "Jane Doe",
    "role": "Staff"
  }
}
```

#### POST /api/auth/refresh
Exchanges an expired token and valid refresh token for a new access token.
- Authorization: Public
- Request Body:
```json
{
  "token": "eyJhbGciOiJIUzI1Ni...",
  "refreshToken": "4a71b2c3-9f8e..."
}
```
- Response (200 OK): Same schema as login response.

#### POST /api/auth/change-password
Changes password for the current authenticated user and resets `mustChangePassword` flag.
- Authorization: Authenticated (Admin, Staff, Parent)
- Request Body:
```json
{
  "currentPassword": "OldPassword1!",
  "newPassword": "NewSecurePassword2026!"
}
```
- Response (200 OK):
```json
{
  "message": "Password updated successfully."
}
```

#### POST /api/auth/admin-reset-password
Forces a password reset for any staff or parent user.
- Authorization: Admin
- Request Body:
```json
{
  "userId": "c1f7b0f4-508b-4a37-b6e1-b4ecde8c2310",
  "newPassword": "TemporaryPassword1!"
}
```
- Response (200 OK):
```json
{
  "userId": "c1f7b0f4-508b-4a37-b6e1-b4ecde8c2310",
  "email": "staff@daycare.local",
  "temporaryPassword": "TemporaryPassword1!",
  "mustChangePassword": true
}
```

#### GET /api/auth/me
Returns current authenticated user details.
- Authorization: Authenticated
- Response (200 OK): User profile details.

#### GET /api/auth/password-policy
Returns password rules enforced by the identity engine.
- Authorization: Public
- Response (200 OK):
```json
{
  "requiredLength": 8,
  "requireNonAlphanumeric": true,
  "requireLowercase": true,
  "requireUppercase": true,
  "requireDigit": true
}
```

---

### 3.2 Staff Controller (`/api/staff`)

#### GET /api/staff
Retrieves staff members with filtering options.
- Authorization: Admin, Staff
- Query Parameters:
  - `activeOnly` (boolean, optional, default: false)
  - `search` (string, optional)
- Response (200 OK):
```json
[
  {
    "id": 1,
    "userId": "c1f7b0f4-508b-4a37-b6e1-b4ecde8c2310",
    "firstName": "Sarah",
    "lastName": "Connor",
    "email": "sarah.connor@daycare.local",
    "phone": "+1-555-0199",
    "hireDate": "2024-03-01",
    "role": "LeadTeacher",
    "isActive": true
  }
]
```

#### POST /api/staff
Creates a new staff member and provisions a corresponding system login account.
- Authorization: Admin
- Request Body:
```json
{
  "firstName": "Sarah",
  "lastName": "Connor",
  "email": "sarah.connor@daycare.local",
  "phone": "+1-555-0199",
  "hireDate": "2024-03-01",
  "role": "LeadTeacher"
}
```
- Response (201 Created): Staff object with generated credentials.

#### GET /api/staff/{id}
Retrieves single staff member details by primary ID.
- Authorization: Admin, Staff

#### PUT /api/staff/{id}
Updates staff profile fields.
- Authorization: Admin

#### DELETE /api/staff/{id}
Performs a soft delete of a staff record and sets user account to inactive.
- Authorization: Admin

#### POST /api/staff/{id}/deactivate
Deactivates a staff member without deleting history.
- Authorization: Admin

#### POST /api/staff/{id}/reactivate
Restores an inactive staff member.
- Authorization: Admin

---

### 3.3 Guardians Controller (`/api/guardians`)

#### GET /api/guardians
Lists all registered child guardians.
- Authorization: Admin, Staff
- Response (200 OK): Array of guardian objects.

#### POST /api/guardians
Registers a new guardian and creates parent portal credentials.
- Authorization: Admin, Staff
- Request Body:
```json
{
  "firstName": "Robert",
  "lastName": "Smith",
  "email": "robert.smith@example.com",
  "phone": "+1-555-0144",
  "relationship": "Father",
  "address": "742 Evergreen Terrace",
  "isEmergencyContact": true
}
```
- Response (201 Created): Guardian profile with provisioned parent account info.

#### GET /api/guardians/{id}
Retrieves guardian profile and list of associated dependents.
- Authorization: Admin, Staff

#### PUT /api/guardians/{id}
Updates guardian contact information.
- Authorization: Admin, Staff

#### DELETE /api/guardians/{id}
Deletes a guardian record if no active dependencies restrict removal.
- Authorization: Admin

---

### 3.4 Children Controller (`/api/children`)

#### GET /api/children
Lists children registered in the daycare system.
- Authorization: Admin, Staff
- Query Parameters:
  - `classroomId` (integer, optional)
  - `search` (string, optional)
- Response (200 OK): Array of children with enrollment and allergy summaries.

#### POST /api/children
Registers a new child and links them to guardians.
- Authorization: Admin, Staff
- Request Body:
```json
{
  "firstName": "Liam",
  "lastName": "Smith",
  "dateOfBirth": "2022-05-14",
  "gender": "Male",
  "medicalNotes": "Mild asthma during winter",
  "guardianIds": [1],
  "allergies": [
    {
      "allergen": "Peanuts",
      "severity": "Severe"
    }
  ]
}
```
- Response (201 Created): Registered child record.

#### GET /api/children/{id}
Returns complete child profile, medical notes, allergies, and emergency contacts.
- Authorization: Admin, Staff

#### PUT /api/children/{id}
Updates child demographic and medical details.
- Authorization: Admin, Staff

#### DELETE /api/children/{id}
Safely removes child record with referential validation checks.
- Authorization: Admin

#### GET /api/children/{id}/daily-history
Returns consolidated history for a child across attendance, meals, activities, and incidents.
- Authorization: Admin, Staff, Parent (only if guardian is linked to child)
- Query Parameters:
  - `startDate` (YYYY-MM-DD, required)
  - `endDate` (YYYY-MM-DD, required)

#### PATCH /api/children/{id}/photo
Updates the avatar photo URL for a child.
- Authorization: Admin, Staff
- Request Body:
```json
{
  "photoUrl": "/uploads/028a6598-c951-4dd6-bbc6-8a37ff30e8ff.png"
}
```

---

### 3.5 Classrooms Controller (`/api/classrooms`)

#### GET /api/classrooms
Returns all classrooms with current enrollment counts and capacities.
- Authorization: Admin, Staff
- Response (200 OK): Array of classroom objects.

#### POST /api/classrooms
Creates a new classroom.
- Authorization: Admin
- Request Body:
```json
{
  "name": "Toddler Explorers",
  "capacity": 15,
  "minAgeMonths": 18,
  "maxAgeMonths": 36,
  "roomNumber": "B-102"
}
```

#### GET /api/classrooms/{id}
Retrieves classroom details including assigned staff members and enrolled children.
- Authorization: Admin, Staff

#### PUT /api/classrooms/{id}
Updates classroom metadata and capacity limits.
- Authorization: Admin

#### DELETE /api/classrooms/{id}
Deletes classroom if no children are actively enrolled.
- Authorization: Admin

---

### 3.6 Classroom Staff Controller (`/api/classroomstaff`)

#### POST /api/classroomstaff
Assigns a staff member to a classroom.
- Authorization: Admin
- Request Body:
```json
{
  "classroomId": 2,
  "staffId": 4,
  "role": "LeadTeacher"
}
```

#### GET /api/classroomstaff/classroom/{classroomId}
Returns all staff assigned to specified classroom.
- Authorization: Admin, Staff

#### GET /api/classroomstaff/staff/{staffId}
Returns all classrooms assigned to specified staff member.
- Authorization: Admin, Staff

#### DELETE /api/classroomstaff/{classroomId}/{staffId}
Removes staff assignment from classroom.
- Authorization: Admin

---

### 3.7 Enrollments Controller (`/api/enrollments`)

#### GET /api/enrollments
Lists enrollment records.
- Authorization: Admin, Staff
- Query Parameters: `activeOnly` (boolean, default: true)

#### POST /api/enrollments
Enrolls an active child into a classroom.
- Authorization: Admin
- Request Body:
```json
{
  "childId": 12,
  "classroomId": 2,
  "startDate": "2026-11-01"
}
```

#### GET /api/enrollments/{id}
Returns specific enrollment record.
- Authorization: Admin, Staff

#### POST /api/enrollments/{id}/end
Terminates an active enrollment.
- Authorization: Admin
- Request Body:
```json
{
  "endDate": "2026-11-30"
}
```

#### POST /api/enrollments/transfer
Transfers a child from their current classroom to a new classroom atomically.
- Authorization: Admin
- Request Body:
```json
{
  "childId": 12,
  "newClassroomId": 3,
  "transferDate": "2026-11-15"
}
```

---

### 3.8 Attendance Controller (`/api/attendance`)

#### POST /api/attendance
Records child check-in for the day.
- Authorization: Admin, Staff
- Request Body:
```json
{
  "childId": 12,
  "classroomId": 2,
  "checkInTime": "2026-11-02T08:15:00Z",
  "notes": "Arrived with mother. Carries medication."
}
```
- Response (201 Created): Attendance record.

#### POST /api/attendance/checkout
Records child check-out and pickup authorization.
- Authorization: Admin, Staff
- Request Body:
```json
{
  "attendanceId": 45,
  "checkOutTime": "2026-11-02T16:45:00Z",
  "pickupPerson": "Robert Smith (Father)"
}
```

#### GET /api/attendance/daily
Returns attendance records for center on a specific date.
- Authorization: Admin, Staff
- Query Parameters: `date` (YYYY-MM-DD, optional, default: today)

#### GET /api/attendance/classroom/{classroomId}
Returns classroom daily attendance roster.
- Authorization: Admin, Staff
- Query Parameters: `date` (YYYY-MM-DD, optional)

#### GET /api/attendance/child/{childId}
Returns historical attendance log for a child.
- Authorization: Admin, Staff, Parent (own child)

---

### 3.9 Meals Controller (`/api/meals`)

#### POST /api/meals
Logs a meal consumption record for a child.
- Authorization: Admin, Staff
- Request Body:
```json
{
  "childId": 12,
  "mealType": "Lunch",
  "portion": "All",
  "timestamp": "2026-11-02T12:15:00Z",
  "foodItems": "Steamed carrots, rice, baked chicken",
  "notes": "Ate with good appetite"
}
```

#### PUT /api/meals/{id}
Updates meal consumption information.
- Authorization: Admin, Staff

#### DELETE /api/meals/{id}
Deletes an incorrectly recorded meal entry.
- Authorization: Admin, Staff

#### GET /api/meals/daily
Returns center-wide meal records for specified date.
- Authorization: Admin, Staff
- Query Parameters: `date` (YYYY-MM-DD)

#### GET /api/meals/child/{childId}
Returns meal history for single child.
- Authorization: Admin, Staff, Parent (own child)

---

### 3.10 Daily Activities Controller (`/api/dailyactivities`)

#### POST /api/dailyactivities
Records a daily event such as nap time, diaper change, outdoor play, or learning activity.
- Authorization: Admin, Staff
- Request Body:
```json
{
  "childId": 12,
  "activityType": "Nap",
  "startTime": "2026-11-02T13:00:00Z",
  "endTime": "2026-11-02T14:30:00Z",
  "notes": "Fell asleep immediately, calm sleep."
}
```

#### PUT /api/dailyactivities/{id}
Modifies an existing activity log.
- Authorization: Admin, Staff

#### DELETE /api/dailyactivities/{id}
Deletes an activity entry.
- Authorization: Admin, Staff

#### GET /api/dailyactivities/daily
Returns all activity entries recorded on specified date.
- Authorization: Admin, Staff

#### GET /api/dailyactivities/child/{childId}
Returns activity entries for a specific child.
- Authorization: Admin, Staff, Parent (own child)

---

### 3.11 Incidents Controller (`/api/incidents`)

#### POST /api/incidents
Logs an incident report (minor scratch, fall, fever, etc.).
- Authorization: Admin, Staff
- Request Body:
```json
{
  "childId": 12,
  "incidentType": "MinorInjury",
  "description": "Scraped knee during outdoor playground activity.",
  "actionTaken": "Cleaned with antiseptic wipe and applied adhesive bandage.",
  "occurredAt": "2026-11-02T10:30:00Z"
}
```

#### GET /api/incidents/child/{childId}
Retrieves incident history for a child.
- Authorization: Admin, Staff, Parent (own child)

#### POST /api/incidents/{id}/acknowledge
Allows guardian to sign or acknowledge incident review.
- Authorization: Parent, Admin
- Response (200 OK): Updated incident status with acknowledgment timestamp.

---

### 3.12 Media Controller (`/api/media`)

#### POST /api/media/upload
Uploads binary image files (avatars, child photos, activity documentation).
- Authorization: Admin, Staff
- Content-Type: multipart/form-data
- Form Parameter: `file` (image file: png, jpg, jpeg, webp)
- Response (200 OK):
```json
{
  "url": "/uploads/028a6598-c951-4dd6-bbc6-8a37ff30e8ff.png",
  "fileName": "028a6598-c951-4dd6-bbc6-8a37ff30e8ff.png",
  "size": 182400
}
```

---

### 3.13 Reports Controller (`/api/reports`)

#### GET /api/reports/daily/{childId}
Compiles a complete daily digest for a child combining attendance, all meals, activities, and incident notices.
- Authorization: Admin, Staff, Parent (own child)
- Query Parameters: `date` (YYYY-MM-DD, optional, default: today)
- Response (200 OK): Aggregated daily report structure.

---

### 3.14 Parent Portal Controller (`/api/parent`)

#### GET /api/parent/children
Lists all children associated with the authenticated parent user.
- Authorization: Parent
- Response (200 OK): Array of child summary cards.

#### GET /api/parent/children/{childId}
Retrieves child dashboard overview for parent application.
- Authorization: Parent (enforces ownership check)

#### GET /api/parent/children/{childId}/live-status
Provides immediate real-time state for a child: check-in status, room location, assigned teacher, latest meal, and recent sleep or diaper updates.
- Authorization: Parent

#### GET /api/parent/children/{childId}/wellbeing
Calculates aggregated daily wellbeing score and indicators.
- Authorization: Parent

#### GET /api/parent/children/{childId}/daily-report
Retrieves structured daily story report for parent display.
- Authorization: Parent

#### POST /api/parent/absence-notice
Submits planned or sick child absence notification directly to administration.
- Authorization: Parent
- Request Body:
```json
{
  "childId": 12,
  "startDate": "2026-11-03",
  "endDate": "2026-11-04",
  "reason": "Family travel",
  "notes": "Will return Thursday morning."
}
```

#### POST /api/parent/pickup-pass
Generates a digital single-use pickup pass for an authorized guardian or alternate contact.
- Authorization: Parent
- Request Body:
```json
{
  "childId": 12,
  "authorizedPersonName": "Grandmother Eleanor",
  "validUntil": "2026-11-02T18:00:00Z"
}
```

#### GET /api/parent/complaints
Lists feedback tickets submitted by the parent.
- Authorization: Parent

#### POST /api/parent/complaints
Submits a inquiry or concern ticket to center management.
- Authorization: Parent
- Request Body:
```json
{
  "subject": "Nap schedule adjustment",
  "description": "Please wake Liam at 14:00 to keep regular night bedtime routine.",
  "priority": "Normal"
}
```

#### POST /api/parent/complaints/{id}/messages
Adds follow-up message to an existing ticket thread.
- Authorization: Parent, Admin

#### GET /api/parent/announcements
Retrieves active center announcements.
- Authorization: Parent

#### GET /api/parent/consents
Lists pending and signed consent agreements (field trip, photo permissions).
- Authorization: Parent

#### POST /api/parent/consents/{id}/sign
Signs a consent agreement with digital signature record.
- Authorization: Parent

#### GET /api/parent/profile
Retrieves guardian profile details and notification settings.
- Authorization: Parent

#### PUT /api/parent/profile
Updates guardian contact and language preference (e.g., en, am).
- Authorization: Parent

---

### 3.15 Chat Controller (`/api/chat`)

#### GET /api/chat/conversations
Lists active conversations accessible to current user.
- Authorization: Admin, Staff, Parent

#### POST /api/chat/conversations
Starts a new direct conversation thread between parent and staff.
- Authorization: Admin, Staff, Parent
- Request Body:
```json
{
  "recipientUserId": "c1f7b0f4-508b-4a37-b6e1-b4ecde8c2310",
  "initialMessage": "Hello, quick question regarding today's medicine schedule."
}
```

#### GET /api/chat/conversations/{id}/messages
Returns historical messages for conversation thread.
- Authorization: Authenticated Participant

#### POST /api/chat/conversations/{id}/messages
Appends message to thread and publishes realtime SignalR event to recipient.
- Authorization: Authenticated Participant
- Request Body:
```json
{
  "content": "Medicine was administered at 11:30 AM after lunch."
}
```

---

## 4. Realtime SignalR Protocol (`/hubs/daycare`)

### 4.1 Connection and Handshake
Clients connect to `/hubs/daycare` with access token passed as query parameter:
```javascript
import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5107/hubs/daycare', {
    accessTokenFactory: () => localStorage.getItem('token')
  })
  .withAutomaticReconnect()
  .build();

await connection.start();
```

### 4.2 Group Subscriptions
The hub automatically places users into groups upon connection based on role and identity:
- `user_{userId}`: Receives direct chat notifications and personal alerts.
- `classroom_{classroomId}`: Staff members receive live classroom attendance updates.
- `parent_{guardianId}`: Parents receive child check-in and check-out notices.

### 4.3 Realtime Hub Events
The server dispatches the following client-side events:

| Event Name | Payload Schema | Description |
| --- | --- | --- |
| ReceiveMessage | `{ conversationId: number, senderId: string, content: string, sentAt: string }` | Incoming chat message notification |
| ChildCheckedIn | `{ childId: number, classroomId: number, checkInTime: string }` | Child arrival notification |
| ChildCheckedOut | `{ childId: number, checkOutTime: string, pickupPerson: string }` | Child departure notification |
| MealLogged | `{ childId: number, mealType: string, portion: string, timestamp: string }` | Meal consumption update |
| ActivityLogged | `{ childId: number, activityType: string, notes: string }` | Nap, diaper, or activity logged |
| IncidentAlert | `{ incidentId: number, childId: number, incidentType: string, description: string }` | Immediate parent incident notice |
