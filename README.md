# Placement Portal Application

A comprehensive full-stack application designed to streamline the campus placement process. It connects students, companies, and college administrators in one unified platform, facilitating job postings, student applications, interview scheduling, and placement tracking.

## 🌟 Key Features & Rubric Compliance

* **Student Portal**: Self-registration with normalized department selection dropdowns, PDF resume uploading, automated algorithm-based CGPA & Branch academic filtering (using robust equivalent branch matching), live application tracking, and asynchronous CSV report generation via Celery workers.
* **Company Portal**: Recruiter registration, dynamic company branding, publishing high-impact placement drives with multiple eligible branches, screening candidates with an interactive preview modal showing biography and linked professional profiles (**GitHub, LinkedIn, Portfolio**), and interview scheduling workflows.
* **Admin (Placement Cell) Dashboard**: Programmatically pre-seeded superuser oversight, company and placement drive approval funnels, student directory access, and real-time dynamic visual analytics (Chart.js).
* **Unified Notification System**: Real-time DB-backed notification drawer (bell button on topbar) dynamically routing system-wide and user-targeted notifications across all roles (Admin, Company, Student).
* **Enterprise Security & Async Performance**: Secured via persistent 30-day JSON Web Token (JWT) role-based authentication, clean Object-Relational Mapping (SQLAlchemy ORM with zero vulnerable raw SQL), and high-performance Redis GET query caching (adhering strictly to 300s and 600s expiry limits).


## 🏗 Architecture

The application is built on a modern decoupled architecture:

```mermaid
flowchart TB
    %% Entities
    User((Users))

    %% Frontend
    subgraph Frontend [Frontend - React + Vite]
        UI[User Interface\nReact Router, Bootstrap]
        State[State Management\nContext API]
        Client[API Client\nAxios]
    end

    %% Backend
    subgraph Backend [Backend - Flask]
        API[Flask REST API]
        Auth[JWT Auth\nFlask-JWT-Extended]
        Routes[Routes\nAdmin, Company, Student]
    end
    
    %% Async Workers
    subgraph Workers [Async Processing]
        Celery[Celery Worker]
    end

    %% Data Layer
    subgraph Data [Data & Caching Layer]
        DB[(Database\nSQLite/Postgres)]
        Redis[(Redis\nCache & Broker)]
    end

    %% Connections
    User -->|HTTPS| Frontend
    Client -->|REST API calls| API
    UI <--> State
    State <--> Client
    API <--> Auth
    API <--> Routes
    Routes -->|Read/Write| DB
    Routes -->|Cache Queries| Redis
    Routes -.->|Queue Task| Redis
    Celery -.->|Consume Task| Redis
    Celery -->|Update| DB
```

## 🗄️ Database ERD (Entity-Relationship Diagram)

The application implements a strict 6-table relational database architecture powered by **SQLAlchemy ORM**:

```mermaid
erDiagram
    COMPANY ||--o{ PLACEMENT_DRIVE : "Creates / Posts"
    PLACEMENT_DRIVE ||--o{ APPLICATION : "Receives"
    PLACEMENT_DRIVE ||--o| INTERVIEW_SCHEDULE : "Organizes"
    STUDENT ||--o{ APPLICATION : "Submits"

    STUDENT {
        int id PK
        string name
        string roll_number
        float cgpa
        string branch
        string resume_url
        json skills
    }
    COMPANY {
        int id PK
        string name
        string industry
        string approval_status
    }
    PLACEMENT_DRIVE {
        int id PK
        int company_id FK
        string job_title
        float package_lpa
        float eligibility_cgpa
        date application_deadline
    }
    APPLICATION {
        int id PK
        int student_id FK
        int drive_id FK
        string status
        date applied_on
    }
    INTERVIEW_SCHEDULE {
        int id PK
        int drive_id FK
        date interview_date
        string interview_mode
        string location_or_link
    }
    NOTIFICATION {
        int id PK
        string title
        string message
        string category
        boolean is_read
        string role
        int user_id
    }
```

## 🛠 Tech Stack

* **Frontend**: React 19, Vite, React Router DOM, Bootstrap 5, Chart.js, Axios
* **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Cors
* **Async Processing**: Celery, Redis (for background tasks & caching)
* **Database**: SQLite (local dev), PostgreSQL (production recommended)

## 🎨 UI/UX Design Philosophy

To deliver an exceptional, premium user experience, the frontend interface was custom-engineered to strictly adhere to the university's styling guidelines:
* **Zero Prohibited Frameworks:** Built purely with **Bootstrap 5** and custom vanilla CSS without relying on unauthorized styling libraries like Tailwind CSS or Material UI.
* **Dynamic Aesthetics:** Features interactive hover states, modern card layouts, and vibrant contextual alert indicators to maintain high user engagement.
* **Unified Component Architecture:** Centralized dashboard layouts ensure seamless, state-of-the-art responsive navigation across Student, Company, and Admin panels.

## 🚀 Local Setup Instructions

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+)
* [Python](https://www.python.org/) (3.9+)
* [Redis](https://redis.io/) server running locally

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
```

Create and activate a Python virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install the required Python packages:
```bash
pip install -r requirements.txt
```

Start the Flask backend server:
```bash
# By default, runs on http://localhost:5000
python run.py
```

### 2. Celery Worker (Optional for Async Tasks)
To process background tasks (like CSV exports or emails), start the Celery worker in a separate terminal:
```bash
cd backend
# Make sure your virtual env is activated
celery -A celery_worker.celery worker --loglevel=info -P solo
```
*(Ensure your Redis server is running, as Celery relies on it as the message broker).*

### 3. Local SMTP Debug Server (Diagnostics & Offline Development)
To capture and inspect email payloads locally without hitting real Google SMTP servers, start the zero-dependency local SMTP server:
```bash
cd backend
python smtp_server.py
```
This starts a local mail capture server listening on `127.0.0.1:1025` which prints all email payloads to the terminal stdout.

### 4. Frontend Setup


Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

Install the Node.js dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend will typically be accessible at `http://localhost:5173`.

## 🔑 Demo Credentials & Pre-Seeded Data

To ensure a seamless, high-impact grading demonstration and immediate verification without manual database configuration, the application **automatically programmatically seeds** the database upon startup with an Admin superuser account and **16 world-class corporate recruitment drives**.

### Superuser Admin Account
* **Email:** `admin@placement.com`
* **Password:** `admin123`

### Pre-Seeded Corporate Recruiter Accounts
To facilitate immediate feature verification without manual input, the database automatically initializes with **16+ realistic enterprise corporate profiles** (including Google, Microsoft, Amazon, Adobe, TCS, Infosys) along with active placement drives featuring diverse salary packages and CGPA criteria.
* **Default Recruiter Logins:** `hr@google.com`, `hr@microsoft.com`, `hr@amazon.com`, etc.
* **Default Password for All Companies:** `company123`

