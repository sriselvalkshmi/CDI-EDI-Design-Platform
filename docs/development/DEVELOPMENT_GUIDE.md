# Developer & Contributor Guide

Welcome to the development guide for the **CDI-EDI-Design-Platform**.

---

## 1. Development Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Git**

---

## 2. Getting Started

### Clone & Install
```bash
git clone https://github.com/sriselvalkshmi/CDI-EDI-Design-Platform.git
cd CDI-EDI-Design-Platform

# Install root dependencies
npm install

# Install frontend dependencies
npm --prefix frontend install
```

### Environment Configuration
Create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Start Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 3. Directory Conventions

- `frontend/src/components/`: Only React UI components and presentation widgets.
- `shared/engineering/`: All mathematical models, chemistry engines, physics equations, and sizing algorithms.
  * Must be pure JavaScript with zero DOM or browser dependencies.
  * Can be imported in both Node.js (test runners/scripts) and Vite (frontend).
- `backend/supabase/`: SQL migrations, RLS policies, seed files, and Edge functions.
- `tests/`: Automated unit, engineering, integration, and smoke test suites.
- `scripts/`: Operational tools, CLI verification scripts, and migration helpers.

---

## 4. Running Tests

### Complete Verification Suite
```bash
npm test
```

### Specific Test Categories
```bash
# Unit tests
npm run test:unit

# Engineering physics & conservation tests
npm run test:engineering

# Integration & E2E workflow tests
npm run test:integration

# Smoke & release traceability audits
npm run test:smoke
```

---

## 5. Production Build
```bash
npm run build
```
The compiled SPA will be output to `frontend/dist/`.
