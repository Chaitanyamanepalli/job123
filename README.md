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

## Key Features

1. **Discover & Category Filtering**: Browse popular categories (e.g. Developer, Design, Marketing) with count details, or explore handpicked Featured Job Openings on the Home Page.
2. **Real-time Search & Multi-Filters**: Filter jobs on the Jobs Page by type (Full Time, Part Time, Contract, Internship, Remote), type search terms in real-time, or sort listings by Salary (High-Low / Low-High), Date Posted (Latest / Oldest), or Alphabetical.
3. **Application Tracking**: A dedicated "My Applications" page caches your candidate email in local storage to automatically retrieve, search, and filter your application history.
4. **Recruiter Console**: An interactive dashboard listing all postings. Recruiters can view submitted applications per job (modal list containing name, email, phone, date), edit postings (pre-filled fields), delete jobs (soft cascade deletion), or publish new roles.
5. **Aesthetics & Theme**: Dark/Light modes inspired by "BlackBucks" theme style, featuring smooth transitions and local storage restoration. Fully mobile-responsive stacking layout.
