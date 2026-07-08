# Personal CRM

A local, single-user sales CRM that runs entirely on your own machine — think of it as your own private Salesforce. No accounts, no cloud, no internet required.

Track organizations, contacts, deals, and activities with a clean, professional interface. Comes pre-loaded with realistic sample data so it looks alive on first launch.

![Status](https://img.shields.io/badge/status-active-brightgreen)

---

## Features

- **Dashboard** — At-a-glance overview of your sales pipeline: stats cards, a bar chart of deals won per month, a list of upcoming/overdue tasks, and a recent activity feed.
- **Organizations** — Searchable table of companies you do business with. Add, edit, delete, and click through to see each organization's contacts and deals.
- **Contacts** — Searchable table of people, filterable by status (lead, qualified, customer). Each contact has a detail page with their organization, activity timeline, and deals.
- **Deals** — Searchable table of potential sales with stage, value (USD), and close date. Full CRUD with detail pages and activity timelines.
- **Pipeline** — Visual Kanban-style board with six stages: **New → Qualified → Proposal → Negotiation → Won → Lost**. Drag and drop deals between columns to update their stage.
- **Activities & Tasks** — Log notes, calls, or emails from any contact or deal detail page. Activities can have a due date and done/undone status, doubling as follow-up tasks that appear on the dashboard.
- **Sample Data** — The app ships with realistic organizations, contacts, deals, and activities pre-loaded on first launch.

### What's not included (v1)

Local-only, single-user. No login, no AI, no email/calendar integrations, no multi-currency, no custom fields or tags. Pipeline stages are fixed.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router 7, TypeScript |
| **Backend** | Express 5 (TypeScript via tsx) |
| **Database** | SQLite (via better-sqlite3) |
| **Charts** | Recharts |
| **Drag & Drop** | @hello-pangea/dnd |
| **Dates** | date-fns |
| **Build** | Vite 8, TypeScript 6 |
| **Testing** | Vitest 4, Puppeteer |
| **Concurrency** | concurrently |

---

## Project Structure

```
crm-main/
├── server/                    # Express API backend
│   ├── index.ts               # Server entry point (port 3001)
│   ├── db.ts                  # SQLite database initialization & schema
│   ├── seed.ts                # Sample data seeder
│   └── api.ts                 # REST API routes for all entity types
├── src/                       # React frontend
│   ├── main.tsx               # App entry point
│   ├── App.tsx                # Route definitions
│   ├── types.ts               # TypeScript interfaces & constants
│   ├── index.css              # All application styles (~900 lines)
│   ├── api/
│   │   └── client.ts          # Frontend API client (fetch-based)
│   ├── components/
│   │   ├── Layout.tsx          # App shell: header + sidebar nav + content area
│   │   └── Modal.tsx           # Reusable modal dialog
│   └── pages/
│       ├── Dashboard.tsx       # Landing page with stats, chart, tasks, activity
│       ├── Organizations.tsx   # Organization list with search & CRUD
│       ├── OrganizationDetail.tsx
│       ├── Contacts.tsx        # Contact list with search, filter & CRUD
│       ├── ContactDetail.tsx
│       ├── Deals.tsx           # Deal list with search & CRUD
│       ├── DealDetail.tsx
│       └── Pipeline.tsx        # Drag-and-drop Kanban board
├── tests/                     # Test files
│   ├── helpers.ts              # Test database setup & seed helpers
│   ├── crud.test.ts            # 22 unit tests for all CRUD operations
│   └── e2e-verify.mjs          # End-to-end verification script
├── crm.db                     # SQLite database file (auto-generated)
├── index.html                 # Vite entry HTML
├── vite.config.ts             # Vite configuration
├── vitest.config.ts           # Test runner configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies & scripts
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (the project was built with Node 22)
- **npm** 8+

### Installation

```bash
# Install dependencies
npm install

# Start the development server (API + frontend concurrently)
npm run dev
```

The app starts two servers:
- **API backend** on `http://localhost:3001`
- **Vite dev server** on `http://localhost:5173` (proxies `/api` requests to the backend)

Open **http://localhost:5173** in your browser. The app automatically seeds itself with sample data on the first run.

### Production Build

```bash
npm run build
```

Builds the frontend into the `dist/` directory. You can then serve it with any static file server alongside the Express API.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both API server and Vite dev server concurrently |
| `npm run server` | Start only the Express API server on port 3001 |
| `npm run client` | Start only the Vite frontend dev server on port 5173 |
| `npm run build` | Build the frontend for production into `dist/` |
| `npm test` | Run all unit tests (Vitest) |
| `npm run test:watch` | Run unit tests in watch mode |

---

## API Overview

The backend provides a RESTful JSON API at `/api`:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/organizations` | GET, POST | List (with search) / create organizations |
| `/api/organizations/:id` | GET, PUT, DELETE | Read / update / delete an organization |
| `/api/contacts` | GET, POST | List (with search & status filter) / create contacts |
| `/api/contacts/:id` | GET, PUT, DELETE | Read / update / delete a contact |
| `/api/deals` | GET, POST | List (with search) / create deals |
| `/api/deals/stages` | GET | List deals grouped by pipeline stage |
| `/api/deals/:id` | GET, PUT, DELETE | Read / update / delete a deal |
| `/api/deals/:id/stage` | PATCH | Update a deal's pipeline stage |
| `/api/activities` | GET, POST | List recent activities / create an activity |
| `/api/activities/tasks` | GET | List incomplete tasks with due dates |
| `/api/activities/:id/toggle` | PATCH | Toggle activity done/undone |
| `/api/dashboard` | GET | Aggregated dashboard data |

---

## Database Schema

The SQLite database has four tables:

- **organizations** — id, name, website, industry, notes, created_at, updated_at
- **contacts** — id, name, email, phone, job_title, organization_id (FK), status (lead/qualified/customer), created_at, updated_at
- **deals** — id, name, organization_id (FK), contact_id (FK), stage (new/qualified/proposal/negotiation/won/lost), value, close_date, created_at, updated_at
- **activities** — id, type (note/call/email), contact_id (FK), deal_id (FK), description, date, due_date, done, created_at

---

## Design

The UI uses a brand color palette of **amber** (`#ecad0a`), **blue** (`#209dd7`), and **purple** (`#753991`) alongside neutral grays. The layout features:

- A sticky top header with the app name
- A fixed left sidebar navigation with section icons
- A responsive content area that adapts to screen size

---

## Testing

22 unit tests covering CRUD operations for all four entity types, including stage changes and task completion toggling:

```bash
npm test
```

Tests use an in-memory SQLite database and the same schema as the main application.
