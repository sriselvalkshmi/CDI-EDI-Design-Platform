# Production Deployment Guide

This document provides step-by-step deployment instructions for setting up the **CDI/EDI Design Platform** on **Netlify** and **Supabase**.

---

## Deployment Checklist

1. [ ] **Supabase Project Created**
2. [ ] **Database Schema Migrated (`supabase/migrations/01_init_schema.sql`)**
3. [ ] **RLS Security Policies Applied (`supabase/policies/rls_policies.sql`)**
4. [ ] **Seed Data Executed (`supabase/seed.sql`)**
5. [ ] **Netlify Site Created & Connected to GitHub**
6. [ ] **Environment Variables Configured in Netlify (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)**

---

## Step 1: Supabase Configuration

1. Create a free project at [Supabase](https://supabase.com).
2. Go to **SQL Editor** in your Supabase Dashboard.
3. Execute the contents of `supabase/migrations/01_init_schema.sql`.
4. Execute the contents of `supabase/policies/rls_policies.sql`.
5. Execute the contents of `supabase/seed.sql`.
6. Copy your **Project URL** and **anon public key** from **Project Settings** > **API**.

---

## Step 2: Netlify Deployment

1. Log into [Netlify](https://netlify.com) and click **Add new site** > **Import an existing project**.
2. Select your GitHub repository.
3. Netlify will automatically detect `netlify.toml`:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
4. Go to **Site Configuration** > **Environment Variables** and add:
   - `VITE_SUPABASE_URL`: `https://<your-project-id>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<your-anon-key>`
5. Click **Deploy Site**.

---

## Verification

- Open your Netlify production URL.
- Verify that the **Engineering Dashboard** loads publicly without login.
- Test running a simulation and exporting an Engineering Report PDF.
- Click **Equation Editor** -> verify login prompt opens.
- Log in as Administrator (`admin@cdiedi.com` / `Admin@123456`) -> verify Admin Panel displays audit tables.
