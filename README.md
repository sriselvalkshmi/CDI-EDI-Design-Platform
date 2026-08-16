# CDI / EDI Engineering Design & Simulation Platform

An enterprise-grade, modular engineering web platform for designing, simulating, and optimizing **Capacitive Deionization (CDI)**, **Membrane CDI (MCDI)**, **Flow CDI (FCDI)**, and **Electrodeionization (EDI)** water treatment systems.

---

## 🌟 Key Features

- **Authoritative Single Source of Truth**: 57 literature-backed equations, physical models, and mass balance derivations isolated in a shared engineering core.
- **Interactive Engineering Dashboard**: Zero-login access to thermodynamic calculations, AI recommendations, component sizing, 3D CAD Stack Viewer, and P&ID diagrams.
- **Protected Equation Editor**: Secure mathematical formula parsing, custom equation management, and PDF report generation.
- **Comprehensive Automated Testing**: 25+ automated test suites with 300+ rigorous physics, mass balance, SEC accounting, and edge-case verification checks.
- **Supabase Authentication & RLS**: User authentication, session management, and Row Level Security (RLS) policies.
- **Serverless CI/CD**: Clean deployment via Netlify and Supabase.

---

## 📁 Repository Structure

```text
CDI-EDI-Design-Platform/
├── frontend/                          # React + Vite UI Application Layer
│   ├── src/
│   │   ├── components/                # UI widgets, modals, charts, PID & 3D viewers
│   │   │   ├── engineering/           # UI-facing CAD/BOM/Schematic renderers
│   │   │   └── modals/                # Diagnostic and traceability dialogs
│   │   ├── context/                   # AppContext, AuthContext
│   │   ├── pages/                     # Dashboard, EquationEditorPage, etc.
│   │   ├── services/                  # Supabase client, Excel exporter, Audit logger
│   │   ├── styles/                    # App.css, pid.css
│   │   ├── utils/                     # UI helpers & report generators
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/                        # Static assets & icons
│   ├── index.html
│   ├── vite.config.js                 # Configured with '@shared' and '@frontend' aliases
│   └── package.json
│
├── backend/                           # Supabase Database & Backend Layer
│   ├── migrations/                    # 01_init_schema.sql (PostgreSQL DDL)
│   ├── policies/                      # rls_policies.sql (Row Level Security)
│   ├── seed/                          # seed.sql (57 equations & initial dataset)
│   └── README.md
│
├── shared/                            # Authoritative Single Source of Truth
│   └── engineering/
│       ├── equations/                 # defaultEquationsDatabase.js (57 Equations), equationCatalog.js
│       ├── engine/                    # engineeringEquationEngine.js, formulaParser.js
│       ├── models/                    # cdiModel.js, mCDIModel.js, fCDIModel.js, ediModel.js, processTrainEngine.js
│       ├── chemistry/                 # waterChemistryEngine.js, waterChemistry.js
│       ├── sizing/                    # componentSizing.js, electrodeModel.js, stackDesigner.js, designOptimizer.js
│       ├── core/                      # singleSourceOfTruth.js, engineeringTruthTable.js, technologyFundamentals.js
│       ├── validation/                # experimentalValidation.js, experimentalCalibration.js
│       ├── templates/                 # CDI.json, MCDI.json, FCDI.json, EDI.json
│       └── index.js                   # Unified barrel export
│
├── tests/                             # Automated Test Suites (25+ Suites, 300+ Checks)
│   ├── unit/                          # Individual model & physics unit tests
│   ├── engineering/                   # First-principles, mass balance, and SEC tests
│   ├── integration/                   # Cross-panel consistency and end-to-end tests
│   └── smoke/                         # Equation registry integrity & traceability audits
│
├── docs/                              # Structured Technical Documentation
│   ├── engineering/                   # Technology model specs, physics derivations & changelogs
│   ├── validation/                    # Literature and experimental validation reports
│   ├── architecture/                  # Architecture.md, Netlify_Setup.md, Supabase_Setup.md
│   └── deployment/                    # Deployment_Guide.md
│
├── scripts/                           # Tooling, CI/CD & Verification Scripts
│   ├── test-all.js                    # Unified test runner
│   ├── seed-db.js                     # Sync 57 equations to backend seed
│   └── audit-check.js                 # System invariant and mass balance check
│
├── netlify.toml                       # Netlify publish directory (frontend/dist)
├── package.json                       # Root workspace runner
└── README.md
```

---

## 🛠️ Quick Local Setup

1. **Install Dependencies**:
   ```bash
   npm install
   npm --prefix frontend install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `frontend/.env` and insert your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Run Automated Test Suite**:
   ```bash
   npm test
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```
