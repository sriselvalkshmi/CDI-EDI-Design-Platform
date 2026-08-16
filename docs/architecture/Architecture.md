# Architecture Overview: 100% Serverless Platform

This document describes the high-level architecture of the **CDI/EDI Design Platform**.

---

## 1. High-Level Architecture Diagram

```
+-------------------------------------------------------------------+
|                           NETLIFY HOSTING                         |
|                                                                   |
|   React 18 Vite Single Page Application (Client SPA)              |
|   +-----------------------------------------------------------+   |
|   |  Public Engineering Dashboard                             |   |
|   |  - AI Technology Recommendation                           |   |
|   |  - Component Sizing & 3D/2D Layout Generator              |   |
|   |  - Dynamic Simulation Engine (In-Browser Calculation)     |   |
|   |  - P&ID Diagram & Recharts Graphs                         |   |
|   |  - PDF Engineering Report Exporter                        |   |
|   +-----------------------------------------------------------+   |
|   |  Protected Equation Editor                                |   |
|   |  - Topological Dependency Solver                          |   |
|   |  - Admin Audit Panel (Administrator Only)                 |   |
|   +-----------------------------------------------------------+   |
+---------------------------------+---------------------------------+
                                  |
                                  | Direct SDK Requests
                                  | (@supabase/supabase-js)
                                  v
+-------------------------------------------------------------------+
|                          SUPABASE BACKEND                         |
|                                                                   |
|   +-----------------------+     +-----------------------------+   |
|   | Supabase Auth         |     | Supabase PostgreSQL         |   |
|   | - Sign Up / Sign In   |     | - public.profiles           |   |
|   | - Session Persistence |     | - public.equations          |   |
|   | - Password Reset      |     | - public.login_history      |   |
|   +-----------------------+     | - public.user_activity      |   |
|                                 | - public.eng_modifications  |   |
|                                 +-----------------------------+   |
|                                 | Row Level Security (RLS)    |   |
|                                 +-----------------------------+   |
+-------------------------------------------------------------------+
```

---

## 2. Architectural Highlights

1. **Zero Express Backend Dependency**:
   - No Express servers, Node process managers, or external hosting (Render/Railway) are required.
   - All complex electrochemical and thermodynamic calculations run in JavaScript inside the user's browser.

2. **Client-Side Calculation Engine (`client/src/engineering/`)**:
   - `engineeringEquationEngine`: Solves mass balances, current densities, energy consumption, and removal efficiencies.
   - `simulationEngine`: Simulates dynamic adsorption and desorption cycles over time.
   - `designOptimizer`: Multivariable optimization finding optimal cell dimensions and operational parameters.
   - `equationEngine`: Custom formula tokenization, Reverse Polish Notation (RPN) evaluation, and topological sorting.

3. **Supabase Database & Security**:
   - Authentication tokens (JWTs) are handled automatically by `@supabase/supabase-js`.
   - RLS policies restrict audit logging tables (`login_history`, `user_activity`, `engineering_modifications`) strictly to users with `role = 'Administrator'`.
