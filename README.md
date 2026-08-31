# CDI / EDI Engineering Design & Simulation Platform

An enterprise-grade, modular engineering web platform for designing, simulating, and optimizing **Capacitive Deionization (CDI)**, **Membrane CDI (MCDI)**, **Flow CDI (FCDI)**, and **Electrodeionization (EDI)** water treatment systems.

---

## 🌟 Key Features

- **Authoritative Single Source of Truth (`shared/engineering/`)**: 57 literature-backed equations, physical models, and mass balance derivations isolated in a shared, pure JavaScript engineering core.
- **Autonomous Technology Selection (AUTO Solver)**: Deterministic, 4-tier feasibility gating (TDS, Recovery, Equipment Envelope, Pretreatment) with multi-variable ranking (SEC, recovery margin, product quality).
- **Interactive Engineering Dashboard (`frontend/`)**: Zero-login access to thermodynamic calculations, AI recommendations, component sizing, 3D CAD Stack Viewer, and P&ID diagrams.
- **Protected Equation Editor**: Secure mathematical formula parsing, custom equation management, and PDF report generation.
- **Comprehensive Automated Testing (`tests/`)**: 25+ automated test suites with 300+ rigorous physics, mass balance, SEC accounting, and edge-case verification checks.
- **Supabase Backend (`backend/supabase/`)**: User authentication, session management, Row Level Security (RLS) policies, and database migrations.
- **Serverless CI/CD**: Seamless deployment via Netlify (`netlify.toml`).

---

## 📁 Repository Structure

```text
CDI-EDI-Design-Platform/
│
├── frontend/                          # React 18 + Vite UI Application Layer
│   ├── src/
│   │   ├── components/                # UI widgets, modals, charts, PID & 3D viewers
│   │   │   ├── engineering/           # UI-facing CAD, schematics, component cards
│   │   │   └── modals/                # Diagnostic, traceability & report dialogs
│   │   ├── context/                   # AppContext (state orchestration), AuthContext
│   │   ├── data/                      # UI fixtures
│   │   ├── pages/                     # Dashboard, EquationEditorPage
│   │   ├── services/                  # Supabase client, Excel exporter, Audit logger
│   │   ├── styles/                    # Global CSS stylesheets
│   │   ├── utils/                     # PDF report generator
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/                        # Static assets & icons
│   ├── index.html                     # App HTML entrypoint
│   ├── vite.config.js                 # Vite configuration with @shared/engineering alias
│   └── package.json                   # Frontend dependencies
│
├── shared/                            # Authoritative Domain & Engineering Core
│   └── engineering/
│       ├── chemistry/                 # Water chemistry speciation, charge balance, LSI
│       ├── core/                      # AI recommendation, single source of truth, fundamentals
│       ├── engine/                    # Authoritative equation engine & formula parser
│       ├── equations/                 # Master 57-equation catalog & physics definitions
│       ├── models/                    # CDI, MCDI, FCDI, EDI & Process Train models
│       ├── sizing/                    # Component sizing, stack design & optimizer
│       ├── templates/                 # Technology configuration JSON templates
│       ├── validation/                # Experimental validation & calibration benchmarks
│       └── index.js                   # Unified barrel export
│
├── backend/                           # Backend Infrastructure & Database
│   ├── supabase/
│   │   ├── migrations/                # PostgreSQL schema DDL migrations
│   │   ├── policies/                  # Row Level Security (RLS) policies
│   │   ├── functions/                 # Supabase Edge Functions
│   │   └── seed.sql                   # Seed SQL dataset
│   └── README.md                      # Backend documentation
│
├── tests/                             # Automated Test Suites (25+ Suites, 300+ Checks)
│   ├── unit/                          # Individual model & technology selection unit tests
│   ├── engineering/                   # First-principles, mass balance, and SEC tests
│   ├── integration/                   # Cross-panel consistency and end-to-end tests
│   └── smoke/                         # Equation registry integrity & traceability audits
│
├── docs/                              # Technical & Engineering Documentation
│   ├── architecture/                  # ARCHITECTURE.md
│   ├── engineering-basis/             # Model validation specifications & literature proofs
│   ├── deployment/                    # Netlify & Supabase setup guides
│   └── development/                   # DEVELOPMENT_GUIDE.md
│
├── scripts/                           # Tooling, CI/CD & Verification Scripts
│   ├── test-all.js                    # Unified test runner
│   ├── validate-gui-auto-selection.mjs# Step 9 GUI validation script
│   ├── verify-all-technologies.js     # Technology verification suite
│   ├── verify-cross-technology-consistency.js # Cross-panel audit script
│   ├── audit-check.js                 # System invariant and mass balance check
│   └── seed-db.js                     # Sync 57 equations to backend seed
│
├── netlify.toml                       # Netlify deployment configuration
├── package.json                       # Root workspace runner
├── package-lock.json                  # Locked dependency tree
├── vitest.config.js                   # Vitest configuration with shared aliases
└── README.md                          # Main project readme
```

---

## 🛠️ Quick Local Setup

1. **Install Dependencies**:
   ```bash
   npm install
   npm --prefix frontend install
   ```

2. **Configure Environment Variables**:
   Copy `frontend/.env.example` to `frontend/.env` and insert your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧪 Running Automated Tests

Run all 25+ automated test suites (300+ checks):
```bash
npm test
```

Or run targeted test categories:
```bash
npm run test:unit            # Run unit tests
npm run test:engineering     # Run engineering physics tests
npm run test:integration     # Run integration tests
npm run test:smoke           # Run smoke & release audits
```

---

## 🏗️ Building for Production

Compile the production bundle:
```bash
npm run build
```
Build artifacts will be emitted to `frontend/dist/`.

---

## 🧭 Engineering Models & AUTO Selection

- **Engineering Models**: Located in [`shared/engineering/models/`](file:///c:/Users/DELL/OneDrive/Attachments/CDI-EDI-Design-Platform/shared/engineering/models/) (`cdiModel.js`, `mCDIModel.js`, `fCDIModel.js`, `ediModel.js`, `processTrainEngine.js`).
- **Equation Catalog**: Master 57 physics formulas in [`shared/engineering/equations/`](file:///c:/Users/DELL/OneDrive/Attachments/CDI-EDI-Design-Platform/shared/engineering/equations/).
- **Autonomous Technology Selection**: Implemented in [`shared/engineering/core/aiRecommendation.js`](file:///c:/Users/DELL/OneDrive/Attachments/CDI-EDI-Design-Platform/shared/engineering/core/aiRecommendation.js) and [`frontend/src/components/TechTradeoffsPanel.jsx`](file:///c:/Users/DELL/OneDrive/Attachments/CDI-EDI-Design-Platform/frontend/src/components/TechTradeoffsPanel.jsx).
- **Architecture Documentation**: Comprehensive data flow specification in [`docs/architecture/ARCHITECTURE.md`](file:///c:/Users/DELL/OneDrive/Attachments/CDI-EDI-Design-Platform/docs/architecture/ARCHITECTURE.md).
