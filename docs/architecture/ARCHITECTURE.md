# System Architecture & Engineering Flow

This document details the multi-tier system architecture and data execution pipeline of the **CDI-EDI-Design-Platform**.

---

## 1. High-Level System Architecture

```text
+-----------------------------------------------------------------------------+
|                               FRONTEND / GUI                                |
|                                                                             |
|  React 18 + Vite Single Page Application                                    |
|  - Dashboard & Parameter Inputs                                             |
|  - TechTradeoffsPanel (Autonomous Selection & Multi-Tech Assessment)        |
|  - EngineeringCalculatorPanel (Deep Stack Sizing & Operating Points)        |
|  - CAD3DStackViewer & PIDDiagram (Visual Topology & Flow Schematics)        |
|  - EquationEditorPage (Equation Catalog & Physics Sandbox)                  |
+--------------------------------------+--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                          STATE ORCHESTRATION LAYER                          |
|                                                                             |
|  AppContext (frontend/src/context/AppContext.jsx)                           |
|  - Sanitize numeric user inputs (Feed TDS, Target TDS, Flow, Recovery)      |
|  - Triggers water chemistry speciation (waterChemistryEngine.js)            |
|  - Invokes AI Recommendation & Dynamic Feasibility Evaluation               |
|  - Executes Multivariable Optimizer & First-Principles Stack Sizing         |
+--------------------------------------+--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                       SHARED ENGINEERING DOMAIN CORE                        |
|                                                                             |
|  Authoritative Single Source of Truth (shared/engineering/)                 |
|  - chemistry/   -> Water speciation, charge balance, LSI scaling index      |
|  - engine/      -> engineeringEquationEngine (Faraday, Joule, Darcy-Weisbach|
|  - equations/   -> Master 57-equation catalog & literature benchmarks       |
|  - models/      -> cdiModel, mCDIModel, fCDIModel, ediModel, processTrain   |
|  - sizing/      -> electrodeModel, componentSizing, designOptimizer         |
|  - validation/  -> Experimental dataset calibrations & benchmark suites     |
+--------------------------------------+--------------------------------------+
                                       |
                                       | Direct Supabase SDK Calls
                                       v
+-----------------------------------------------------------------------------+
|                             BACKEND INFRASTRUCTURE                          |
|                                                                             |
|  Supabase PostgreSQL + Auth + RLS (backend/supabase/)                       |
|  - Master equation library table (public.equations)                         |
|  - Audit logging & traceability records (public.audit_logs)                 |
|  - Saved engineering simulation runs (public.simulation_runs)               |
+-----------------------------------------------------------------------------+
```

---

## 2. Engineering Calculation & AUTO Selection Pipeline

The design platform executes a deterministic, physics-upward calculation pipeline ensuring 100% mass balance closure, strict thermodynamic boundedness, and zero hardcoded outcomes:

```text
GUI User Inputs (Feed TDS, Hardness, Flow, Target TDS, Target Recovery)
    │
    ▼
[Step 1] Water Chemistry Analysis & Speciation Engine (waterChemistry.js)
    ├── Derives ionic charge balance error (<5% validation)
    ├── Calculates specific conductivity (µS/cm) & equivalent NaCl molarity
    └── Evaluates calcium carbonate scaling risk & LSI index
    │
    ▼
[Step 2] Multi-Technology Feasibility Evaluation (TechTradeoffsPanel & aiRecommendation)
    ├── Evaluates each candidate independently against feed chemistry:
    │   ├── CDI  -> 0 membranes, co-ion expulsion, cyclic batch
    │   ├── MCDI -> AEM/CEM paired, >92% charge efficiency, cyclic batch
    │   ├── FCDI -> Flowing carbon slurry, non-Newtonian pumping, continuous
    │   └── EDI  -> Continuous mixed-bed resin, water-splitting regeneration
    │
    ├── Applies Strict Hard Feasibility Gate:
    │   ├── 1. Product TDS PASS (Outlet TDS ≤ Target TDS)
    │   ├── 2. Water Recovery PASS (Recovery ≥ Target Recovery)
    │   ├── 3. Equipment & Literature Envelope PASS
    │   └── 4. Pretreatment PASS (EDI requires RO if Feed TDS > 30 mg/L)
    │
    ▼
[Step 3] Autonomous Technology Selection (AUTO Recommendation)
    ├── feasibleCandidates = all candidates passing all 4 gates
    ├── IF feasibleCandidates.length === 0:
    │   └── AUTO = NONE — DESIGN ENVELOPE EXCEEDED (Requires multi-stage train)
    └── IF feasibleCandidates.length > 0:
        └── AUTO = rankFeasibleCandidates(feasibleCandidates)[0]
            └── Ranked by: Lowest SEC (kWh/m³) -> Highest Recovery -> TDS margin
    │
    ▼
[Step 4] First-Principles Sizing & Multivariable Optimization
    ├── Faraday current derivation: I_faraday = (Q_feed · ΔC · z · F) / (MW · η_charge)
    ├── Stack voltage & series Joule heating: V_stack = N_pairs · V_cell
    ├── Darcy-Weisbach hydraulic channel velocity & pressure drop: ΔP = f · (L/Dh) · (ρ·v²/2)
    └── Multivariable optimizer tunes module count, cell pairs, and voltage
    │
    ▼
[Step 5] Single Source of Truth Output Dispatch
    ├── 3-way balance conservation checks (Water, Solute, Charge)
    ├── Comprehensive BOM generation & 3D CAD parametric geometry
    └── P&ID flowsheet, Recharts simulation curves & PDF design reports
```

---

## 3. Separation of Concerns Principles

1. **Decoupled User Selection vs. AUTO Solver**:
   * What the user selects manually (`Active Candidate`) is kept strictly independent from what the algorithm recommends (`AUTO Recommendation`).
2. **Zero Inverted Hardcodes**:
   * No technology receives a recommendation badge unless it is present in the computed `feasibleCandidates` array.
3. **Multi-Stage Fallback**:
   * When single-stage direct electrosorption cannot achieve the target setpoint, the engine recommends multi-stage process trains (e.g., `RO → EDI` or `Multi-stage MCDI`).
