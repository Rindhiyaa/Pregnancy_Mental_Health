# PPD Risk Insight — Complete Project Documentation

> **Full-stack clinical mental health platform** for detecting and managing Postpartum Depression (PPD) risk in pregnant patients. Built with **React + Vite** (frontend) and **FastAPI + SQLAlchemy** (backend), integrating a **CatBoost ML model** for risk predictions.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Models](#4-database-models)
5. [Backend API](#5-backend-api)
6. [Frontend Routing](#6-frontend-routing)
7. [Doctor Portal](#7-doctor-portal)
8. [Nurse Portal](#8-nurse-portal)
9. [Patient Portal](#9-patient-portal)
10. [Admin Portal](#10-admin-portal)
11. [Shared / Common Pages](#11-shared--common-pages)
12. [UI Component Library](#12-ui-component-library)
13. [Authentication & Security](#13-authentication--security)
14. [ML Model Integration](#14-ml-model-integration)
15. [Theme System](#15-theme-system)

---

## 1. Project Overview

PPD Risk Insight is a role-based clinical decision support system with four distinct portals:

| Portal | Role | Primary Responsibility |
|--------|------|------------------------|
| **Doctor Portal** | `doctor` | Review AI-analysed assessments, validate risk, finalise clinical decisions |
| **Nurse Portal** | `nurse` | Register patients, conduct assessments, schedule appointments |
| **Patient Portal** | `patient` | View results, care plan, mood tracking, resources, messages |
| **Admin Portal** | `admin` | Manage users, system overview |

### Clinical Workflow

```
Patient registered (Nurse)
      ↓
Assessment conducted (Nurse) → ML risk prediction generated
      ↓
Assessment submitted for review (Doctor queue)
      ↓
Doctor reviews responses (section-by-section pager)
      ↓
Doctor validates risk + writes care plan → Finalize Decision
      ↓
Follow-up scheduled → Patient sees results in portal
```

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Dev server & build tool |
| react-router-dom | 6 | Client-side routing |
| react-hot-toast | — | Toast notifications |
| lucide-react | — | Icons |
| recharts | — | AI bar charts & data viz |
| Vanilla CSS / inline styles | — | Styling (via ThemeContext) |

### Backend
| Technology | Purpose |
|-----------|---------|
| FastAPI | REST API framework |
| SQLAlchemy | ORM / database layer |
| PostgreSQL | Primary database |
| JWT (jose) | Authentication tokens |
| CatBoost | ML risk prediction model |
| SHAP | Model explainability |
| Pydantic | Schema validation |
| `python-dotenv` | Environment config |

---

## 3. Project Structure

```
Pregnancy_Mental_Health/
├── backend/
│   └── app/
│       ├── main.py                # FastAPI app entry, middleware config
│       ├── models.py              # SQLAlchemy ORM models
│       ├── schemas.py             # Pydantic request/response schemas
│       ├── database.py            # DB engine & session
│       ├── config.py              # Env vars, CORS origins
│       ├── jwt_handler.py         # Token generation & verification
│       ├── ml_model.py            # CatBoost model loading & inference
│       ├── security.py            # Password hashing
│       ├── rate_limiter.py        # Request rate limiting
│       ├── model_files/           # Trained .cbm model file
│       ├── utils/                 # Email utilities, helpers
│       └── routers/
│           ├── auth.py            # Login, register, password reset
│           ├── assessments.py     # Assessment CRUD + ML inference
│           ├── doctor.py          # Doctor-specific endpoints
│           ├── nurse.py           # Nurse-specific endpoints
│           ├── patient_portal.py  # Patient-facing endpoints
│           ├── patients.py        # Patient management
│           ├── follow_ups.py      # Follow-up scheduling
│           ├── notifications.py   # Notification system
│           ├── predictions.py     # Direct ML prediction endpoint
│           └── admin.py           # Admin user management
│
└── frontend/
    └── src/
        ├── App.jsx                # Root component
        ├── main.jsx               # Vite entry
        ├── ThemeContext.jsx       # Dark/light theme provider
        ├── AuthContext.jsx        # Auth state (user, token, role)
        ├── constants/
        │   └── assessmentData.js  # ASSESSMENT_SECTIONS definition
        ├── utils/
        │   ├── api.js             # Fetch wrapper (auth headers)
        │   └── dummyData.js       # Mock data for development
        ├── components/
        │   ├── AppRouter.jsx      # All routes defined here
        │   ├── ProtectedRoute.jsx # Role-based route guard
        │   ├── DoctorSidebar.jsx  # Doctor nav
        │   ├── NurseSidebar.jsx   # Nurse nav
        │   ├── PatientSidebar.jsx # Patient nav
        │   └── UI.jsx             # Shared component library
        └── pages/
            ├── doctor/            # Doctor portal pages
            ├── nurse/             # Nurse portal pages
            ├── patient/           # Patient portal pages
            └── admin/             # Admin portal pages
```

---

## 4. Database Models

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer PK | Auto |
| `first_name` | String | Required |
| `last_name` | String | Optional |
| `email` | String (unique) | Login credential |
| `phone_number` | String (unique) | Patient login |
| `hashed_password` | String | bcrypt |
| `role` | String | `doctor`, `nurse`, `patient`, `admin` |
| `first_login` | Boolean | Force password change |
| `is_active` | Boolean | Account status |

### `patients`
| Column | Type | Notes |
|--------|------|-------|
| `id` | BigInteger PK | |
| `name`, `age`, `email`, `phone` | — | Demographics |
| `dob`, `blood_group`, `address`, `city` | — | Profile |
| `emergency_name/phone/relation` | — | Emergency contact |
| `pregnancy_week`, `due_date`, `gravida`, `para` | — | Obstetric data |
| `created_by_nurse_id` | FK → users | Who registered |
| `assigned_doctor_id` | FK → users | Responsible doctor |
| `status` | String | `active`, `inactive` |

### `assessments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer PK | |
| `patient_id` | FK → patients | |
| `nurse_id` | FK → users | Conducting nurse |
| `doctor_id` | FK → users | Reviewing doctor |
| `raw_data` | JSON | All form responses |
| `risk_score` | Float | ML prediction score |
| `risk_level` | String | `Low`, `Moderate`, `High` |
| `clinician_risk` | String | Doctor's final verdict |
| `risk_level_final` | String | Override value |
| `override_reason` | String | Justification if overridden |
| `plan` | String | Patient care instructions |
| `notes` | String | Internal clinical notes |
| `status` | String | `submitted`, `reviewed`, `approved` |
| `reviewed_at` | DateTime | Completion timestamp |

### `follow_ups`
| Column | Type | Notes |
|--------|------|-------|
| `patient_id` | FK → patients | |
| `assessment_id` | FK → assessments | |
| `scheduled_date` | DateTime | |
| `status` | String | `pending`, `completed`, `missed` |
| `type` | String | `check-in`, `first`, `second`, `discharge` |
| `clinician_email` | String | Assigned clinician |

### `mood_entries`
| Column | Type | Notes |
|--------|------|-------|
| `user_id` | FK → users | Patient user |
| `mood_score` | Integer | 1–5 scale |
| `note` | String | Optional note |

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| `sender_id`, `receiver_id` | FK → users | |
| `content` | String | Message body |
| `is_read` | Boolean | Read status |

### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| `title`, `message` | String | Content |
| `type` | String | `alert`, `success`, `info` |
| `priority` | String | `high`, `medium`, `low` |
| `clinician_email` | String | Target recipient |

---

## 5. Backend API

**Base URL:** `http://localhost:8000`  
**Docs:** `http://localhost:8000/api/docs`

### Authentication — `/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | JWT login (email or phone) |
| POST | `/auth/register` | Create new user account |
| POST | `/auth/forgot-password` | Send OTP reset email |
| POST | `/auth/reset-password` | Reset password with OTP |
| PUT | `/auth/change-password` | Change password (first login) |
| GET | `/auth/me` | Get current user profile |

### Assessments — `/assessments` / `/doctor`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/assessments/submit` | Nurse submits assessment → triggers ML |
| GET | `/doctor/assessments` | Doctor queue of submitted assessments |
| GET | `/doctor/assessments/{id}` | Fetch single assessment detail |
| PUT | `/doctor/assessments/{id}/review` | Save/finalise clinical decision |
| POST | `/doctor/assessments/{id}/analyze` | Run AI analysis on assessment |
| GET | `/doctor/patients` | Patients assigned to doctor |
| GET | `/doctor/history` | Doctor's past reviewed assessments |

### Nurse — `/nurse`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/nurse/patients` | Nurse's patient list |
| GET | `/nurse/patients/{id}` | Patient profile detail |
| GET | `/nurse/assessments` | Assessment history |
| GET | `/nurse/appointments` | Nurse's follow-up appointments |

### Patients — `/patients`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/patients/register` | Register new patient |
| GET | `/patients/{id}` | Get patient by ID |
| PUT | `/patients/{id}` | Update patient profile |

### Follow-ups — `/follow-ups`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/follow-ups` | Get follow-ups for clinician |
| POST | `/follow-ups` | Create manual follow-up |
| PUT | `/follow-ups/{id}` | Update follow-up status |

### Patient Portal — `/patient`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/patient/results` | Patient's assessment results |
| GET | `/patient/careplan` | Patient's care plan |
| GET | `/patient/messages` | Patient's messages |
| POST | `/patient/messages` | Send message to clinician |
| GET | `/patient/mood` | Get mood entries |
| POST | `/patient/mood` | Log mood entry |
| GET | `/patient/notifications` | Patient's notifications |

### Notifications — `/notifications`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | Get notifications for clinician |
| PUT | `/notifications/{id}/read` | Mark notification read |

### Predictions — `/predict`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/predict` | Direct ML inference from feature vector |

### Admin — `/admin`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | List all users |
| DELETE | `/admin/users/{id}` | Delete user |

---

## 6. Frontend Routing

All routes defined in `AppRouter.jsx`. Protected by `ProtectedRoute` with role checks.

| Path | Component | Role |
|------|-----------|------|
| `/` | HomePage | Public |
| `/about` | AboutPage | Public |
| `/signin` | SignInPage | Public |
| `/signup` | SignUpPage | Public |
| `/forgot-password` | ForgotPasswordPage | Public |
| `/profile` | ProfilePage | Authenticated |
| **Doctor Routes** | | |
| `/doctor/dashboard` | DashboardPage | doctor |
| `/doctor/patients` | PatientsPage | doctor |
| `/doctor/patients/:id` | DoctorPatientProfile | doctor |
| `/doctor/assessments` | AssessmentsPage | doctor |
| `/doctor/review/:id` | DoctorAssessmentReview | doctor |
| `/doctor/validate/:id` | ClinicalValidation | doctor |
| `/doctor/history` | HistoryPage | doctor |
| `/doctor/profile` | DoctorProfilePage | doctor |
| **Nurse Routes** | | |
| `/nurse/dashboard` | NurseDashboard | nurse |
| `/nurse/patients` | NursePatientsPage | nurse |
| `/nurse/patients/:id` | NursePatientProfile | nurse |
| `/nurse/patients/new` | NurseRegisterPatient | nurse, doctor |
| `/nurse/assessment/new` | NurseNewAssessment | nurse, doctor |
| `/nurse/assessments` | NurseAssessmentHistory | nurse |
| `/nurse/appointments` | NurseAppointmentsPage | nurse, doctor |
| `/nurse/doctors` | NurseDoctorsPage | nurse |
| `/nurse/messages` | ClinicianMessages | nurse |
| `/nurse/profile` | NurseProfilePage | nurse |
| **Patient Routes** | | |
| `/patient/dashboard` | PatientDashboard | patient |
| `/patient/results` | PatientResults | patient |
| `/patient/mood` | PatientMoodTracker | patient |
| `/patient/careplan` | PatientCarePlan | patient |
| `/patient/resources` | PatientResources | patient |
| `/patient/messages` | PatientMessages | patient |
| `/patient/profile` | PatientProfile | patient |
| `/patient/change-password` | PatientChangePassword | patient |

---

## 7. Doctor Portal

### Sidebar Navigation (`DoctorSidebar.jsx`)
- Dashboard
- Assessments (pending review queue)
- Patients
- History
- My Profile

### Pages

#### `DashboardPage.jsx` — `/doctor/dashboard`
- Summary stats: pending assessments, active patients, completed reviews
- Recent assessment table with patient names, risk level badges, status
- Quick action: navigate to assessment review

#### `AssessmentsPage.jsx` — `/doctor/assessments`
- Lists all submitted assessments pending review
- Filter by risk level, status
- Each row links to `/doctor/review/:id`

#### `DoctorAssessmentReview.jsx` — `/doctor/review/:id`
- **Section-by-section pager** — shows one section at a time
- Progress bar + dot indicators (clickable)
- Questions displayed in **2-column grid** with numbered badges (`01`, `02`…)
- Labels: 11px uppercase muted; Answers: 14px regular weight
- Subtle `glassBorder` dividers between rows
- **Prev / Next** buttons at footer
- At last section → **"Proceed to Validation"** navigates to `/doctor/validate/:id`

#### `ClinicalValidation.jsx` — `/doctor/validate/:id`
- **Left card — AI Risk Analysis:**
  - "Generate AI Risk Profile" button → calls `/doctor/assessments/{id}/analyze`
  - Shows confidence score % + CatBoost SHAP feature bar chart
- **Right card — Clinical Decision Form:**
  - Validated Risk Level (dropdown): Low / Moderate / High / Override
  - Override Justification (conditional textarea)
  - Patient Care Instructions (textarea)
  - Nurse Protocol Allocation: urgency + window selects + instruction textarea
  - **Finalize Clinical Decision** button (primary)
  - **Save Progress** button (secondary)
- Returns to `/doctor/assessments` on finalise

#### `PatientsPage.jsx` — `/doctor/patients`
- Searchable, filterable patient directory
- Patient cards with avatar, name, week of pregnancy, assigned status

#### `DoctorPatientProfile.jsx` — `/doctor/patients/:id`
- Full patient demographics, obstetric info, emergency contact
- Assessment history timeline for the patient

#### `HistoryPage.jsx` — `/doctor/history`
- All reviewed/approved assessments
- View modal showing full assessment detail

#### `DoctorProfilePage.jsx` — `/doctor/profile`
- Doctor's own profile info, editable fields

#### `ClinicianMessages.jsx` (nurse messages, shared)
- Used by Nurse portal at `/nurse/messages`

---

## 8. Nurse Portal

### Sidebar Navigation (`NurseSidebar.jsx`)
- Dashboard
- Patients
- New Assessment
- Assessment History
- Appointments
- Our Doctors
- Messages
- My Profile

### Pages

#### `NurseDashboard.jsx` — `/nurse/dashboard`
- Patient statistics, today's appointments
- Recent assessment list
- Quick links: Register Patient, New Assessment

#### `NursePatientsPage.jsx` — `/nurse/patients`
- Full patient directory with search, filter by status
- Avatar with initial, status badges
- Action buttons: View Profile, New Assessment

#### `NursePatientProfile.jsx` — `/nurse/patients/:id`
- Detailed patient profile
- Contact info, obstetric details, emergency contact
- Assessment history for that patient

#### `NurseRegisterPatient.jsx` — `/nurse/patients/new`
- Multi-field form: personal, obstetric, emergency contact
- Assigns nurse ID and doctor on creation

#### `NurseNewAssessment.jsx` — `/nurse/assessment/new`
- Multi-section assessment form driven by `ASSESSMENT_SECTIONS` constant
- Captures all clinical intake responses (raw_data JSON)
- On submit: calls backend, triggers CatBoost prediction
- Redirects to assessment history on success

#### `NurseAssessmentHistory.jsx` — `/nurse/assessments`
- All assessments submitted by this nurse
- Status badges: submitted, reviewed, approved
- Risk level colour-coded badges

#### `NurseAppointmentsPage.jsx` — `/nurse/appointments`
- Calendar + appointment list
- New appointment modal: patient selector, date/time, type
- Day overview panel on calendar click

#### `NurseDoctorsPage.jsx` — `/nurse/doctors`
- List of available doctors
- Contact info, specialty

#### `NurseProfilePage.jsx` — `/nurse/profile`
- Nurse profile details, editable

---

## 9. Patient Portal

### Sidebar Navigation (`PatientSidebar.jsx`)
- Dashboard
- My Results
- Mood Tracker
- Care Plan
- Resources
- Messages
- My Profile
- Change Password

### Pages

#### `PatientDashboard.jsx` — `/patient/dashboard`
- Welcome banner with name
- Latest assessment risk result
- Upcoming appointments
- Quick mood log widget
- Notifications panel

#### `PatientResults.jsx` — `/patient/results`
- Most recent assessment result card
- Risk level badge (Low / Moderate / High)
- SHAP feature importance bar chart (what factors affected the score)
- Care instructions from doctor
- Assessment history list

#### `PatientMoodTracker.jsx` — `/patient/mood`
- Daily mood rating (1–5 emoji scale)
- Optional text note
- Historical mood chart (line/bar)

#### `PatientCarePlan.jsx` — `/patient/careplan`
- Doctor-authored care instructions
- Follow-up schedule and status
- Nurse protocol / check-in timeline

#### `PatientResources.jsx` — `/patient/resources`
- Curated mental health resource cards
- Articles, helplines, breathing exercises

#### `PatientMessages.jsx` — `/patient/messages`
- Chat-style messaging with assigned clinician
- Read receipts

#### `PatientProfile.jsx` — `/patient/profile`
- View and edit personal details
- Pregnancy information display

#### `PatientChangePassword.jsx` — `/patient/change-password`
- Forced on first login
- Current + new + confirm password fields

---

## 10. Admin Portal

### Pages (`/pages/admin/`)
- User management: list, create, deactivate, delete users
- Role assignment
- System overview (placeholder for future analytics)

---

## 11. Shared / Common Pages

| Page | Route | Description |
|------|-------|-------------|
| `HomePage.jsx` | `/` | Landing / marketing page |
| `AboutPage.jsx` | `/about` | About the platform |
| `SignInPage.jsx` | `/signin` | Email/phone + password login |
| `SignUpPage.jsx` | `/signup` | Self-registration (patient) |
| `ForgotPasswordPage.jsx` | `/forgot-password` | OTP email reset flow |
| `ProfilePage.jsx` | `/profile` | Generic profile (fallback) |
| `NotFoundPage.jsx` | `*` | 404 catch-all |

---

## 12. UI Component Library

**File:** `src/components/UI.jsx`

All components use `useTheme()` for consistent dark/light theming.

| Component | Props | Description |
|-----------|-------|-------------|
| `Card` | `glass`, `style` | Container with glassmorphism support |
| `Badge` | `variant` (`success`/`warning`/`danger`/`info`), `size` | Status chip |
| `PageTitle` | `title`, `subtitle` | Page heading block |
| `Loader2` | `size`, `color` | Spinning loader |
| `Divider` | `style` | Horizontal rule |
| `Button` | `variant`, `size`, `disabled` | Styled button |

---

## 13. Authentication & Security

### Flow
1. **Login** (`POST /auth/login`) — returns `access_token` (JWT)
2. Token stored in `AuthContext` (React state + localStorage)
3. All API calls use `api.js` wrapper which injects `Authorization: Bearer <token>`
4. `ProtectedRoute` checks role from `AuthContext.user.role` before rendering

### Security Middleware (backend)
- `TrustedHostMiddleware` — restricts allowed hosts in production
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `HSTS` (prod only)
- Rate limiting (`rate_limiter.py`) — applies to `/api/*` in production only
- CORS — explicitly configured allowed origins; development allows localhost variants

### Password Reset
1. User submits email → OTP generated and emailed
2. OTP submitted with new password → validated and updated
3. First-login patients forced to change default password

---

## 14. ML Model Integration

**File:** `backend/app/ml_model.py`  
**Model:** CatBoost Classifier (`.cbm` file in `model_files/`)

### Prediction Pipeline
1. Assessment form data (`raw_data` JSON) extracted
2. Features mapped and encoded to model input vector
3. CatBoost `predict_proba()` returns risk probability
4. Probability thresholded → `Low`, `Moderate`, or `High` risk label
5. SHAP values computed for feature importance explanation
6. Results stored in `assessment.risk_score` and `assessment.risk_level`

### SHAP Visualisation
- `top_risk_factors` array returned alongside prediction
- Displayed in doctor's Clinical Validation page as a horizontal bar chart (Recharts `BarChart`)
- Also shown in Patient Results page so patients understand contributing factors

---

## 15. Theme System

**File:** `src/ThemeContext.jsx`

Provides a `theme` object consumed via `useTheme()` hook across all pages.

### Key Theme Tokens

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `pageBg` | Deep navy | Off-white | Page background |
| `primary` | Teal/indigo | Teal/indigo | Buttons, accents |
| `textPrimary` | White | Dark grey | Main body text |
| `textMuted` | Dim grey | Medium grey | Labels, subtitles |
| `glassBg` | Translucent white | Translucent white | Card backgrounds |
| `glassBorder` | Subtle white | Subtle grey | Card/input borders |
| `inputBg` | Semi-transparent | Light grey | Input backgrounds |
| `dangerText` | Red | Dark red | Errors, overrides |

### Input Styling Convention (Clinical Forms)
- Border: `1.5px solid ${theme.primary}40` (40% opacity primary tint)
- Background: `theme.inputBg || rgba(0,0,0,0.04)`
- Visible on both light and dark themes ✓

---

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                  # Starts on http://localhost:5173
```

### Environment Variables (`.env`)
```env
DATABASE_URL=postgresql://user:pass@localhost/ppd_db
SECRET_KEY=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your@email.com
EMAIL_PASS=your_password
ALLOWED_ORIGINS=http://localhost:5173
```

---

*Last updated: March 2026 — PPD Risk Insight v1.0*
