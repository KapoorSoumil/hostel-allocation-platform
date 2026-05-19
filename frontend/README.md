# Hostel Allocation Frontend

React + Vite frontend for the hostel allocation platform.

## Stack

- React
- TypeScript
- Vite
- Lucide icons
- Plain CSS architecture
- Student and admin dashboards
- WebSocket live updates

## Setup

```bash
npm install
npm run dev
npm run build
npm run preview
```

The app runs at:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` to:

```text
http://localhost:4000
```

## Sample Login

```text
Registration number: 22CSE001
Password: Password@123
```

## Pages

- Student login
- Admin login
- Student dashboard
- Admin dashboard
- Rank and CGPA display
- Counseling slot timer
- Hostel block browsing
- Room category availability cards
- Hostel block room browsing
- Room search and category filtering
- Room details and occupancy indicators
- Room allocation confirmation
- Roommate OTP verification
- Admin analytics, reports, slot controls, and import tools

## Production

```bash
npm ci
npm run build
```

Deploy `dist` to static hosting or use the included Docker/Nginx setup.

See the root `DEPLOYMENT.md` for full deployment steps.
