# JobPortal Pro

JobPortal Pro is a professional, full-stack recruitment platform that provides a production-ready SaaS look and feel for recruiters to manage listings and candidate applicants to discover, search, filter, and track applications.

## Technical Stack
- **Frontend**: React.js (Vite React Template), Lucide React (Icons), Vanilla CSS (BlackBucks design system)
- **Backend**: Node.js + Express.js, Custom validation middlewares, MVC Architecture
- **Database**: MongoDB + Mongoose

---

## Getting Started

### Prerequisites
- Node.js (v22.14.0 or higher recommended)
- MongoDB instance running locally (default: `mongodb://127.0.0.1:27017/jobportal_pro`)

### Installation & Run

#### 1. Setup Backend
1. Go to the `server/` directory:
   ```bash
   cd server
   ```
2. The environment variables are defined in `.env` (a template is available in `.env.example`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/jobportal_pro
   ```
3. Run the database seeder to populate mock jobs and candidate applications:
   ```bash
   npm run seed
   ```
4. Start the Express backend server (under Nodemon):
   ```bash
   npm run dev
   ```
   The server starts listening on `http://localhost:5000`.

#### 2. Setup Frontend
1. Go to the `client/` directory:
   ```bash
   cd ../client
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The site is accessible at `http://localhost:5173/`.

---

## Key Features & Upgrades

### 1. Advanced Recruiter Operations & Logos
- **Company Logos**: Recruiters can upload custom branding images (JPG, PNG) up to 2MB. Logos are stored in static assets directories and loaded dynamically in job cards.
- **Candidate Evaluations**: Recruiter dash displays candidate skills, experience level, and education. Includes a secure link to open/download parsed resumes in PDF.
- **Chat Actions**: Direct "Message Candidate" trigger from any application row, automatically opening the chat interface.

### 2. Jobs Explorer Sidebar
- **Advanced Filters**: Sidebar query inputs for *Company Name* keyword matching and *Min/Max Salary Range* boundaries.
- **Dynamic Sorting**: Instant re-ordering by *Salary: Low to High*, *Salary: High to Low*, *Latest*, *Oldest*, and *Alphabetical (A-Z)*.

### 3. Messaging & Real-Time Socket.IO
- **1-to-1 Chat Room**: Immediate text delivery and online status indicators (Active now vs Offline).
- **Socket Notifications**: Instant header notifications and popup toasts for:
  - Recruiters: When a candidate submits a new application.
  - Candidates: When their status is updated (Shortlisted/Rejected).
  - Messaging: New chat text alerts.

### 4. Candidate Profile & AI Resume Parser
- **PDF Resume Upload**: Drag-and-drop resume uploader on profile page. Uses server-side `pdf-parse` combined with smart regex heuristic rules to automatically parse and pre-populate skills, education, and experience.
- **Strength completion indicator**: Track and preview profile completeness score.

### 5. Administration Control Center
- **System Stats**: Display system-wide user counts (recruiters, candidates), active postings, and total applications.
- **Moderation Tools**: Delete spam user accounts, remove abusive job posts, or cancel invalid job application records.

### 6. Production Security Layer
- **NoSQL Protection**: Middleware sanitizes incoming query/body objects, stripping keys containing `$` to block injection vectors.
- **Rate limiting**: API request constraints configured to prevent DDoS or spam.
- **Helmet Headers & Validation**: Secure CORS policies and schema checks (express-validator) validate body formatting before controller execution.
