# CDI / EDI Engineering Design & Simulation Platform

A enterprise-grade, serverless engineering web application for designing, simulating, and optimizing **Capacitive Deionization (CDI)**, **Membrane CDI (MCDI)**, **Flow CDI (FCDI)**, and **Electrodeionization (EDI)** water treatment systems.

---

## 🌟 Key Features

- **Public Engineering Dashboard**: Zero-login access to thermodynamic calculations, AI technology recommendations, component sizing, 3D/2D layout generation, P&ID diagrams, dynamic simulations, and interactive performance charts.
- **Client-Side Calculation Engine**: Thermodynamic & electrochemical models (EDL double layer model, Butler-Volmer kinetics, Navier-Stokes channel flow, salt adsorption capacity) run 100% in-browser.
- **Protected Equation Editor**: Secure formula parsing and custom equation management with topological dependency sorting.
- **Supabase Enterprise Authentication**: User sign up, email login, session management, and role-based access control (RBAC).
- **Row Level Security (RLS) & Audit Logging**: Real-time auditing of user logins, activity streams, and parameter modifications in Supabase PostgreSQL tables.
- **Serverless Architecture**: Deployed seamlessly using Netlify (Frontend SPA) and Supabase (Auth & Database).

---

## 🚀 Technology Stack

- **Frontend**: React 18, Vite 5, Recharts, Lucide Icons, jsPDF & autoTable.
- **Backend & Database**: Supabase Auth, Supabase PostgreSQL, Row Level Security (RLS).
- **Hosting & CI/CD**: Netlify (Client SPA hosting with automated builds).

---

## 📁 Repository Structure

```
CDI-EDI-Design-Platform/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Dashboard, P&ID, Simulation, & Graph components
│   │   ├── context/          # AppContext with client calculation engine & Supabase Auth
│   │   ├── engineering/      # Client-side thermodynamic & electrochemical calculation engines
│   │   ├── pages/            # Dashboard, EquationEditorPage, Login
│   │   ├── services/         # supabaseClient.js, auditLogger.js
│   │   ├── styles/           # CSS design system
│   │   └── utils/            # reportGenerator
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── supabase/
│   ├── migrations/           # 01_init_schema.sql (PostgreSQL DDL)
│   ├── policies/             # rls_policies.sql (Row Level Security)
│   └── seed.sql              # Default equations & Admin role seed
├── docs/
│   ├── Architecture.md       # Serverless architecture documentation
│   ├── Deployment_Guide.md   # Deployment walkthrough
│   ├── Netlify_Setup.md      # Netlify deployment guide
│   └── Supabase_Setup.md     # Supabase DDL & RLS setup
├── .env.example
├── netlify.toml              # Netlify build & SPA routing configuration
└── README.md
```

---

## 🛠️ Quick Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/CDI-EDI-Design-Platform.git
   cd CDI-EDI-Design-Platform
   ```

2. **Install Client Dependencies**:
   ```bash
   npm --prefix client install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `client/.env` and insert your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

4. **Start Development Server**:
   ```bash
   npm --prefix client run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 📖 Documentation

- [Architecture Overview](docs/Architecture.md)
- [Deployment Guide](docs/Deployment_Guide.md)
- [Netlify Setup](docs/Netlify_Setup.md)
- [Supabase Setup & RLS](docs/Supabase_Setup.md)
