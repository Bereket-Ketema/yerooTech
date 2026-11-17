# YerooTech: Multi-Tenant SaaS Attendance Management System

> Fully transformed from a basic prototype into a modern, scalable, enterprise-grade multi-tenant SaaS Attendance Management System built with **Django REST Framework** and **Next.js (TypeScript & Tailwind CSS)**.

---

## 🌟 Key Features

### 🏢 Multi-Tenant Architecture & Account Governance
- **Tenant Isolation**: Each attendance taker acts as an independent tenant owning their groups, sessions, and records. Tenant data is isolated across models, queries, and permissions.
- **Role-Based Access Control**:
  - `Platform Administrator`: System oversight, pending taker approval/rejection, user moderation.
  - `Attendance Taker`: Group management, session control, live arrival monitoring, manual audit overrides.
  - `Participant`: Mobile-first portal, group enrollment, QR/GPS/PIN check-ins, personal history.
- **Approval Workflow**: Attendance taker registrations enter `PENDING_APPROVAL` status until vetted by platform administrators.

### ⚡ 4 Attendance Recording Methods
1. **Dynamic QR Code Attendance**: Session-specific QR codes with anti-replay expiry and dynamic token regeneration.
2. **GPS Geofencing Attendance**: Permitted radius validation with Haversine distance calculation in the backend.
3. **Temporary PIN Attendance**: 6-digit session access codes with configurable time-windows.
4. **Manual Roster & Audit Trail**: Single and bulk marking (Present, Late, Absent, Excused) with mandatory modification audit logs.

### 📊 Reports & Analytics
- Aggregate attendance summaries with attendance rate percentage.
- Detection of frequent absentees and attendance method breakdowns.
- **1-Click Export Engines**:
  - **PDF**: Landscape tabular reports with branding via ReportLab.
  - **Excel (.xlsx)**: Formatted spreadsheets with headers and column auto-sizing via openpyxl.
  - **CSV**: Instant data export.

### 🔮 Future Expansion Readiness
- **NFC Support Architecture**: Participant schema equipped with unique `nfc_card_uid` field for physical RFID/NFC smartcard tapping.
- **Subscription Architecture**: Configurable plans (Free, Pro, Enterprise) and tenant subscription models ready for billing gateway hookup without blocking MVP features.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.14, Django 5.1, Django REST Framework, SimpleJWT, SQLite / PostgreSQL |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Export Engines** | ReportLab (PDF), openpyxl (Excel), CSV |
| **Security** | Argon2/PBKDF2 Password Hashing, JWT rotation & blacklisting, Haversine Geofencing |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend

# Activate virtual environment
source ../venv/bin/activate

# Apply migrations
python manage.py migrate

# Seed demonstration accounts and sample groups/sessions
python manage.py seed_data

# Run the Django REST Framework server
python manage.py runserver 8000
```
Backend API will be available at: `http://127.0.0.1:8000/api/v1/`  
Django Administration: `http://127.0.0.1:8000/admin/`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies (already prepared)
npm install

# Run the Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🔑 Pre-Seeded Demonstration Accounts

| Role | Email | Password | Description |
|---|---|---|---|
| **Platform Administrator** | `admin@yerootech.com` | `Admin@123456` | Full platform governance & review queue |
| **Approved Attendance Taker** | `taker@yerootech.com` | `Taker@123456` | Full access to create groups & sessions |
| **Pending Attendance Taker** | `pending@yerootech.com` | `Pending@123456` | Awaiting admin review (demonstrates restriction) |
| **Participant / Student 1** | `student1@yerootech.com` | `Student@123456` | Mobile-first portal, QR/GPS/PIN submissions |
| **Participant / Student 2** | `student2@yerootech.com` | `Student@123456` | Enrolled in sample Software Engineering class |

*(Fast 1-Click login buttons are available directly on the `/login` page for instant testing).*

---

## 📡 Core API Reference

### Authentication (`/api/v1/auth/`)
- `POST /register/`: Register Attendance Taker (starts as `pending`).
- `POST /register/participant/`: Register Participant (auto-approved).
- `POST /login/`: Obtain JWT access and refresh tokens.
- `GET /profile/`: Retrieve current user profile.
- `POST /logout/`: Blacklist refresh token.

### Attendance Groups (`/api/v1/groups/`)
- `GET /`: List tenant's attendance groups.
- `POST /`: Create group.
- `GET /{id}/registration_qr/`: Generate enrollment QR code & invite URL.
- `GET /{id}/members/`: List enrolled participants.
- `POST /join/`: Participant enrolls via `invite_token` or `unique_code`.

### Attendance Sessions (`/api/v1/attendance/`)
- `GET /sessions/`: List sessions (supports filtering by group and status).
- `POST /sessions/`: Create new session (QR, GPS, PIN, or Manual).
- `POST /sessions/{id}/start/`: Launch live attendance.
- `POST /sessions/{id}/close/`: Close attendance.
- `GET /sessions/{id}/qr_code/`: Retrieve dynamic session QR code.
- `POST /sessions/{id}/refresh_qr/`: Anti-replay dynamic token refresh.
- `POST /submit/qr/`: Participant submits attendance via QR token.
- `POST /submit/gps/`: Participant submits GPS coordinates for geofence validation.
- `POST /submit/pin/`: Participant submits 6-digit temporary PIN.
- `POST /sessions/{id}/manual_attendance/`: Single participant manual mark.
- `POST /sessions/{id}/bulk_manual/`: Bulk manual attendance marking.
- `PATCH /record/{id}/modify/`: Modify record with mandatory audit reason.

### Reports (`/api/v1/reports/`)
- `GET /summary/`: Calculate attendance rates, method breakdown, and frequent absentees.
- `GET /export/pdf/`: Export branded PDF attendance report.
- `GET /export/excel/`: Export formatted Excel (.xlsx) workbook.
- `GET /export/csv/`: Export CSV logs.

### Platform Administration (`/api/v1/platform/`)
- `GET /dashboard/`: Global platform metrics.
- `GET /pending/`: Queue of pending attendance takers.
- `POST /users/{id}/action/`: Approve, reject, suspend, or reactivate user accounts.

---

## 🧪 Automated Testing
Backend tests cover authentication, tenant isolation, QR duplicate prevention, PIN verification, GPS Haversine distance validation, and manual audit trails:
```bash
cd backend
python manage.py test apps.core
```
Result: **7 passed (100% success rate)**.

