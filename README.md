# Sports Tournament Management System

## 📖 Project Overview

A full‑stack **Multi‑Sport Tournament Management System** built to showcase a modern web development stack. The application allows administrators and tournament organizers to manage sports, players, teams, tournaments, venues, matches, scores, standings, users, and roles.

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT authentication
- **Frontend**: React, TypeScript, React Router, Tailwind CSS, Axios
- **Database**: PostgreSQL (via Prisma migrations)

The repository follows a clean layered architecture with clear separation of concerns:

```
backend/
  src/
    config/
    controllers/
    middleware/
    routes/
    services/
    validators/
    utils/
    types/
    app.ts
  prisma/
    schema.prisma
    seed.ts
  package.json
frontend/
  src/
    components/
    pages/
    layouts/
    hooks/
    services/
    types/
    utils/
    context/
    App.tsx
  index.css
  package.json
```

---

## 🛠️ Prerequisites

- **Node.js ≥ 20** (including npm) – make sure `node --version` and `npm --version` work.
- **PostgreSQL** – a local instance or Docker container.
- **Git** – to clone the repository if you haven't already.

---

## 🚀 Quick Start (Development Mode)

> The steps below will get both the backend API and the React frontend running locally with hot‑reload.

### 1️⃣ Clone the repository (if you haven't already)

```bash
git clone <repository‑url> d:/sports_app
cd d:/sports_app
```

### 2️⃣ Set up the **backend**

```powershell
# Navigate to backend
cd d:/sports_app/backend

# Install dependencies
npm install

# Create a .env file (copy from .env.example if present) and set the DATABASE_URL, e.g.:
#   DATABASE_URL="postgresql://postgres:password@localhost:5432/sports_app"
#   JWT_SECRET="your‑strong‑secret"
#   PORT=4000

# Run Prisma migrations and generate the client
npx prisma migrate dev --name init   # creates tables
npx prisma generate                  # generates client

# (Optional) Seed the database with sample data
node prisma/seed.js

# Start the backend dev server (watch mode)
npm run dev   # equivalent to: ts-node-dev src/app.ts
```

The backend will be reachable at `http://localhost:4000` (or the port you set).

### 3️⃣ Set up the **frontend**

```powershell
# Open a new terminal window and navigate to frontend
cd d:/sports_app/frontend

# Install dependencies
npm install

# Create a .env file (copy from .env.example if present) and set the API base URL, e.g.:
#   VITE_API_BASE_URL="http://localhost:4000"

# Start the React development server
npm run dev   # starts Vite on http://localhost:5173 by default
```

Visit the frontend URL (usually `http://localhost:5173`) in your browser. The UI will communicate with the backend API you started earlier.

---

## 📦 Production Build (Optional)

### Backend

```bash
npm run build   # compiles TypeScript to ./dist
node dist/app.js # runs the compiled server
```

### Frontend

```bash
npm run build   # creates a static site in ./dist
# Serve the static files with any static web server (e.g., serve, nginx)
 npx serve -s dist   # quick local preview
```

---

## 🗓️ Weekly Development Roadmap

| Week | Goal | Key Backend Files | Key Frontend Files |
|------|------|-------------------|--------------------|
| **1** | Project scaffolding, Prisma schema, authentication boilerplate | `backend/src/app.ts`, `backend/src/middleware/auth.ts`, `backend/prisma/schema.prisma` | `frontend/src/App.tsx`, `frontend/src/pages/Login.tsx` |
| **2** | Tournament CRUD, team registration, sport selection | `backend/src/services/tournamentService.ts`, `backend/src/controllers/tournamentController.ts`, `backend/src/routes/tournamentRoutes.ts` | `frontend/src/pages/Tournaments.tsx`, `frontend/src/components/TournamentForm.tsx` |
| **3** | Venues, matches, fixture generation | `backend/src/services/venueService.ts`, `backend/src/services/matchService.ts` | `frontend/src/pages/Venues.tsx`, `frontend/src/pages/Matches.tsx` |
| **4** | Scoring, results, standings | `backend/src/services/scoreService.ts`, `backend/src/services/standingService.ts` | `frontend/src/pages/ScoreEntry.tsx`, `frontend/src/components/StandingsTable.tsx` |
| **5** | Statistics APIs (player & team) | `backend/src/services/playerStatisticService.ts`, `backend/src/services/teamStatisticService.ts` | `frontend/src/pages/PlayerStats.tsx`, `frontend/src/pages/TeamStats.tsx` |
| **6** | Reporting, role‑based access, final polish | `backend/src/routes/reportRoutes.ts`, `backend/src/middleware/roles.ts` | `frontend/src/pages/Reports.tsx`, `frontend/src/components/ProtectedRoute.tsx` |

Follow the spec in `sports_tournament_management_system_6_week_spec.md` for detailed acceptance criteria per week.

---

## 📚 Useful Commands Cheat‑Sheet

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npx prisma migrate dev` | Apply migrations and create DB tables |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `node prisma/seed.js` | Populate DB with sample data |
| `npm run dev` (backend) | Start backend with hot‑reload |
| `npm run dev` (frontend) | Start Vite dev server |
| `npm run build` (backend) | Compile TypeScript to `dist/` |
| `npm run build` (frontend) | Build production‑ready static files |

---

## ❓ Need Help?

- **Environment variables** – ensure the `.env` files in both `backend/` and `frontend/` are correctly configured.
- **Database connection errors** – verify PostgreSQL is running and the `DATABASE_URL` is accurate.
- **Port conflicts** – change the `PORT` (backend) or Vite `--port` (frontend) in the respective `.env` files.
- **Further documentation** – each folder contains a `README.md` with more detailed notes.

Happy coding! 🎉
