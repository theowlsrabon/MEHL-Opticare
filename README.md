# MEHL OptiCare — Hospital & Retail Optical OS

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169e1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**MEHL OptiCare** is an open-source, enterprise-grade Optical Hospital & Retail Enterprise Resource Planning (ERP) platform. Built for eye care hospitals, ophthalmic clinics, robotic glazing labs, and multi-branch optical retail networks, it provides an end-to-end operational operating system.

---

## 🌟 Key Highlights

- ⚡ **High-Precision Optical POS**: Single-page point of sale supporting frames, ophthalmic lenses, contact lenses, accessories, and clinical eye examination fees.
- 🔬 **5-Stage Lab Glazing Pipeline**: Visual conveyor board tracking optical trays from job intake, automated lens edging, frame assembly, QA verification, to patient pickup.
- 👓 **Exact Rx Matrix & Lens Configurator**: Spherical (SPH), Cylindrical (CYL), Axis, Addition (ADD), Pupillary Distance (PD), lens materials (1.56, 1.61, 1.67, 1.74), and anti-reflective/blue-cut coatings.
- 🌐 **Multi-Branch & Inter-Branch Transfers (IBT)**: Centralized inventory requisitions and transit tracking across hospital headquarters, outpatient branches, and specialty eye centers.
- 📦 **Supply Chain, PO & GRN**: End-to-end procurement workflows with Purchase Orders, Goods Received Notes (GRN), and supplier payable ledgers.
- 📊 **Real-time Financials (P&L)**: Operating profit & loss statements, expense voucher management, counter cashier drawer balance tracking, and daily closing settlements.
- 🛡️ **Role-Based Access Control (RBAC)**: Fine-grained permissions for Super Admin, Branch Admin, Optometrist, Lab Technician, Cashier, and Sales Executive profiles.
- 🔄 **Granular Database Control & Purge Center**: Production-safe factory wipes, per-page operational resets, time-window purges, and category cleans with password enforcement and system audit logging.
- 🌐 **Bilingual (English & বাংলা)**: Complete localized UI supporting English and Bengali with regional currency formatting (৳ BDT).

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client[Web Client - React 19 + Vite] -->|REST API / HTTPS| Backend[Node.js / Express Backend]
    Client -->|Local Storage / Offline Cache| BrowserCache[(Browser IndexedCache)]
    Backend -->|Database Pool / TLS| Postgres[(PostgreSQL Database)]
    Cron[Automated Nightly Settlement] -->|Scheduled Task| Backend
```

### Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, QR & Barcode Tools |
| **Backend** | Node.js, Express, TypeScript, esbuild bundle pipeline |
| **Database** | PostgreSQL (Neon serverless or self-hosted standard Postgres) |
| **Deployment** | Vercel (Frontend SPA) + Render / Docker / VM (Backend API) |

---

## 📦 Core Modules

### 1. Point of Sale & Billing Suite (`POS & ERP`)
- Barcode and QR code quick scanning via physical USB scanners or built-in camera scanner.
- Split payment handling: Cash, Card, and digital mobile financial services (MFS).
- Automatic calculation of salesman sales commission rates and real-time counter drawer collection balance.

### 2. Optical Lab & Glazing Conveyor (`Lab Pipeline`)
- 5 discrete stages: `1. Intake & Barcoding` → `2. Edging & Cutting` → `3. Assembly & Mounting` → `4. Quality Inspection` → `5. Handover & Delivery`.
- Rush and Stat job tags for express turnaround times.
- Automated patient SMS dispatch for order status updates and ready-for-pickup notifications.

### 3. Inventory & Frame Registry (`Stock Master`)
- Real-time stock valuation across frames, ophthalmic lenses, sunglasses, and solutions.
- Stock movements audit trail (restocks, adjustments, sales deductions, and damaged write-offs).
- Batch barcode label generator with printable shelf tags.

### 4. Due Collections Ledger (`Receivables`)
- Centralized tracking of unpaid balances and patient credit accounts.
- Partial payment reconciliation with instant printable receipts.
- Batch SMS reminders for overdue accounts.

### 5. Multi-Branch Operations (`Multi-Branch & IBT`)
- Inter-Branch Transfer orders between regional dispensaries and the central glazing lab.
- Stock dispatch and receipt reconciliation to prevent in-transit shrinkage.

### 6. Database Control & Purge Center
- Secure management of operational data lifecycles.
- Targeted purges for individual modules (prescriptions, expenses, salesman history, purchase orders, customer dues) without affecting unrelated database records.
- Immutable activity log recorded with precise timestamp, actor username, and action details.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A PostgreSQL database instance (local PostgreSQL or cloud-hosted)

### 1. Clone the Repository

```bash
git clone https://github.com/theowlsrabon/MEHL-Opticare.git
cd MEHL-Opticare
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Backend Server Configuration
PORT=3000
NODE_ENV=production

# PostgreSQL Database Connection URL
DATABASE_URL=postgresql://username:password@localhost:5432/mehl_opticare?sslmode=prefer

# Frontend API Endpoint (Leave empty in local development to use relative proxy)
VITE_API_URL=
```

### 4. Initialize Database Schema

Run the provided SQL script to initialize the database tables:

```bash
psql -d mehl_opticare -f schema.sql
```

*(Alternatively, run `npm run server` — the application will automatically create and verify all required database tables on boot).*

### 5. Start Development Servers

Run both the frontend and backend concurrently:

```bash
# Terminal 1: Backend API Server
npm run server

# Terminal 2: Frontend Vite Dev Server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## 🛠️ Build & Production Deployment

### Compile Frontend

```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

### Compile Backend

```bash
npm run build:backend
```
The compiled Node.js CommonJS server bundle will be generated in `dist/server.cjs`.

### Run Production Server

```bash
NODE_ENV=production node dist/server.cjs
```

---

## 🔒 Security & Privacy

- **Data Privacy**: No patient medical records, phone numbers, or clinical notes are transmitted to third-party tracking services.
- **Access Control**: Administrative actions and sensitive data reset operations require verified administrative credentials.
- **Audit Trail**: High-impact actions (price overrides, stage advancements, data purges) generate immutable security audit log entries with timestamps.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "feat: Add amazing new feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this software for personal and commercial optical clinic operations.
