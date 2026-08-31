# Backend Infrastructure & Database Layer

This directory houses the backend infrastructure, database schemas, Row Level Security (RLS) policies, edge functions, and seeding scripts for the **CDI-EDI-Design-Platform**.

---

## Directory Structure

```text
backend/
├── supabase/
│   ├── migrations/               # PostgreSQL schema DDL migrations
│   │   └── 01_init_schema.sql    # Core tables: equations, audit_logs, simulation_runs, user_profiles
│   ├── policies/                 # Row Level Security (RLS) policies
│   │   └── rls_policies.sql      # Multi-tenant and role-based access rules
│   ├── functions/                # Supabase Edge Functions (Deno / TypeScript)
│   │   └── calculate-design/     # Serverless headless engineering computation endpoint
│   └── seed.sql                  # Initial seed dataset with master equation library
└── README.md                     # Backend documentation
```

---

## Database Architecture

### Core Tables

1. **`equations`**
   * Stores the master library of 57 literature-backed equations.
   * Fields: `id`, `name`, `category`, `technology`, `latex_representation`, `js_formula`, `variables`, `assumptions`, `provenance`, `created_at`, `updated_at`.

2. **`audit_logs`**
   * Immutable event log capturing parameter changes, calculations, and optimization decisions.
   * Fields: `id`, `user_id`, `action`, `technology`, `input_snapshot`, `output_snapshot`, `timestamp`.

3. **`simulation_runs`**
   * Saved engineering simulation runs and Pareto optimization states.
   * Fields: `id`, `user_id`, `design_name`, `feed_water`, `target_spec`, `technology_selected`, `results`, `created_at`.

4. **`user_profiles`**
   * User metadata and application authorization roles (`engineer`, `admin`, `viewer`).

---

## Row Level Security (RLS) Policies

All tables enforce strict Row Level Security:
- **Anonymous Users / Public Read**: Can query active verified equations and system defaults.
- **Authenticated Engineers**: Can create and execute simulations, export designs, and log calculation events.
- **Administrators**: Can add, modify, or calibrate custom equations in the equation catalog.

---

## Headless Engineering Edge Functions

The `calculate-design` edge function allows headless API execution of the authoritative physics engine without requiring the browser GUI:
```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/calculate-design \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "technology": "MCDI",
    "feedWater": { "tds": 500, "flowRate": 10, "targetTds": 50, "targetRecovery": 95 }
  }'
```
