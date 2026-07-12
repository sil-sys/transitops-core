# 🚛 TransitOps Core

**A full-stack fleet & logistics operations platform built on the MERN stack.**

TransitOps Core helps fleet teams manage vehicles, drivers, trips, fuel, maintenance, and expenses from a single role-based dashboard — with built-in cost and utilization reporting baked right in.

![MERN](https://img.shields.io/badge/Stack-MERN-3ddc84?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node](https://img.shields.io/badge/Node.js-Express%205-339933?style=flat-square&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Unlicensed-lightgrey?style=flat-square)

---

## 📖 Overview

TransitOps models a real fleet operation end to end: vehicles get assigned to trips, trips consume fuel and generate revenue, vehicles accrue maintenance and expense costs, and drivers are tracked by license status and safety score. A dashboard and cost-report module roll all of this up into fleet-wide KPIs — utilization, cost per vehicle, fuel efficiency, and ROI.

Access is fully role-based, so what a user can see and do depends on whether they're a **Fleet Manager**, **Driver**, **Safety Officer**, or **Financial Analyst**.

---

## ✨ Features

| Module | What it does |
|---|---|
| 🔐 **Auth & Roles** | JWT-based auth with 4 roles: `FleetManager`, `Driver`, `SafetyOfficer`, `FinancialAnalyst`. Routes and UI gated per role. |
| 🚚 **Vehicle Management** | Registration, type, load capacity, odometer, fuel level, acquisition cost, region & status (`Available`, `On Trip`, `In Shop`, `Retired`). |
| 🧑‍✈️ **Driver Management** | License number/category/expiry (auto-flags expired licenses), contact info, safety score, experience, duty status. |
| 🗺️ **Trip Lifecycle** | Full workflow: `Draft → Vehicle Assigned → Driver Assigned → Route Planned → Ready for Dispatch → Dispatched → Completed/Cancelled`, with dispatch checklist, cargo details, stops, document uploads & post-trip figures. |
| ⛽ **Fuel Logs** | Per-vehicle fuel entries (liters, cost, date), optionally linked to a trip. |
| 🔧 **Maintenance Logs** | Service type, description, cost, active/closed status per vehicle. |
| 💰 **Expenses** | General per-vehicle expense tracking beyond fuel & maintenance. |
| 📊 **Dashboard** | Fleet-wide KPIs — utilization %, active/pending trips, drivers on duty, vehicle status breakdown, top-5 vehicles by cost. Filterable by type/status/region. |
| 📈 **Cost Reports** | Fuel cost, maintenance cost, total operational cost, fuel efficiency, fleet utilization, revenue & vehicle ROI. |

---

## 🛠️ Tech Stack

**Client**
- ⚛️ React 19 + Vite
- 🧭 React Router 7
- 🎨 Tailwind CSS 4
- 📊 Recharts
- 🔗 Axios

**Server**
- 🟢 Node.js + Express 5
- 🍃 MongoDB + Mongoose
- 🔑 JSON Web Tokens (`jsonwebtoken`)
- 🔒 bcryptjs
- 🌐 CORS with origin allowlist

---

## 📁 Project Structure
---

## 🔌 API Endpoints

All routes are prefixed with `/api` and (except `/health`, `/auth/register`, `/auth/login`) require a `Bearer` token.

| Resource | Endpoint | Access |
|---|---|---|
| Health | `GET /api/health` | Public |
| Auth | `POST /api/auth/register` | Public |
| Auth | `POST /api/auth/login` | Public |
| Auth | `GET /api/auth/me` | Authenticated |
| Vehicles | `GET/POST /api/vehicles` · `GET/PUT/DELETE /api/vehicles/:id` | Write → `FleetManager` |
| Drivers | `GET/POST /api/drivers` · `GET/PUT/DELETE /api/drivers/:id` | Authenticated |
| Trips | `GET/POST /api/trips` · `GET/PUT/DELETE /api/trips/:id` | Read → `FleetManager`, `Driver`, `SafetyOfficer`; Create/Delete → `FleetManager` |
| Fuel Logs | `GET/POST /api/fuel` · `GET/PUT/DELETE /api/fuel/:id` | Authenticated |
| Expenses | `GET/POST /api/expenses` · `GET/PUT/DELETE /api/expenses/:id` | Authenticated |
| Maintenance | `GET /api/maintenance` · `POST/PUT/DELETE` | Write → `FleetManager` |
| Reports | `GET /api/reports/cost` | `FleetManager`, `FinancialAnalyst` |
| Dashboard | `GET /api/dashboard` | Authenticated (supports `type`, `status`, `region` filters) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A MongoDB connection string (local or Atlas)

### 1️⃣ Clone the repo
```bash
git clone https://github.com/sil-sys/transitops-core.git
cd transitops-core
```

### 2️⃣ Set up the server
```bash
cd server
npm install
cp .env.example .env
```
Fill in `.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/transitops?retryWrites=true&w=majority
JWT_SECRET=your_own_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```
Run it:
```bash
npm run dev
```
> ✅ On first run, the server auto-seeds demo users, drivers, and vehicles.

### 3️⃣ Set up the client
```bash
cd ../client
npm install
npm run dev
```
The Vite dev server proxies `/api` → `http://localhost:5000`. To point elsewhere, set `VITE_API_URL` in a `client/.env` file.

App runs at 👉 `http://localhost:5173`

---

## 👤 Demo Accounts

All seeded automatically — password for everyone: `test1234`

| Role | Email |
|---|---|
| 🧑‍💼 Fleet Manager | `alex@transitops.com` |
| 🚗 Driver | `driver1@transitops.com` |
| 🦺 Safety Officer | `safety@transitops.com` |
| 💵 Financial Analyst | `finance@transitops.com` |

---

## 🔐 Roles & Access

| Role | Access |
|---|---|
| **FleetManager** | Full access — vehicles, drivers, trips, maintenance, fuel, expenses, reports, dashboard |
| **Driver** | View/update trips, view dashboard |
| **SafetyOfficer** | View drivers, trips, reports, dashboard |
| **FinancialAnalyst** | View fuel logs, expenses, reports, dashboard |

---

## 📄 License

No license specified yet.
