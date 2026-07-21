# Production Deployment Guide - CDI/EDI Design Platform

This guide outlines the procedure for deploying the **CDI/EDI Design Platform** with **Supabase Authentication**, **Supabase PostgreSQL Database**, **Render** for the Express backend, and **Netlify** for the React frontend.

---

## 1. System Architecture

```
                                 Users / Browsers
                                        │
                                        ▼
                      ┌──────────────────────────────────┐
                      │    Netlify (React + Vite UI)     │
                      │ https://effulgent-...netlify.app │
                      └────────────────┬─────────────────┘
                                       │
                      Supabase Auth & API Requests
                                       │
                      ┌────────────────┴─────────────────┐
                      │                                  │
                      ▼                                  ▼
    ┌──────────────────────────────────┐ ┌──────────────────────────────────┐
    │    Render (Express Backend)      │ │   Supabase (Auth & Database)     │
    │ https://cdi-edi-...onrender.com  │ │ PostgreSQL Schema & RLS Policies │
    └──────────────────────────────────┘ └──────────────────────────────────┘
```

---

## 2. Supabase Setup & Database Schema

### Step 1: Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and log in.
2. Click **New Project**, enter project name (e.g. `cdi-edi-platform`), and set a strong database password.
3. Once created, navigate to **Project Settings** > **API**.
4. Copy your **Project URL** (`SUPABASE_URL`), **anon public key** (`SUPABASE_ANON_KEY`), and **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`).

### Step 2: Execute SQL DDL Script
Open **SQL Editor** in Supabase, create a query, and execute [`server/db/schema.sql`](file:///c:/Users/DELL/OneDrive/Attachments/CDI-EDI-Design-Platform/server/db/schema.sql) to initialize:
- `profiles` table
- `user_roles` table (Default: `Engineer`)
- `login_history` audit table
- `user_activity` audit table
- `engineering_modifications` audit table
- `equations` library table
- Sign-up trigger for automatic profile & role creation
- Row Level Security (RLS) policies

### Step 3: Assign Administrator Account
After creating your administrator user via Supabase Auth or email sign up, execute:
```sql
UPDATE public.user_roles 
SET role = 'Administrator' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@cdi-edi.platform');
```

---

## 3. Environment Variables Configuration

### Backend Environment Variables (`server/.env`) on Render:
```env
PORT=5007
NODE_ENV=production
CLIENT_ORIGIN=https://effulgent-twilight-1ce68d.netlify.app
SUPABASE_URL=https://your-supabase-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Frontend Environment Variables (`client/.env.production`) on Netlify:
```env
VITE_API_URL=https://cdi-edi-design-platform-1.onrender.com/api
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 4. Render Deployment (Express Backend)

1. Push your updated code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** > **Blueprint** or **Web Service**.
4. Select your repository. Set build command: `npm install` inside `server` directory, and start command: `node app.js`.
5. Add backend environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLIENT_ORIGIN`).
6. Deploy the web service.

---

## 5. Netlify Deployment (React Frontend)

1. Log into [Netlify Dashboard](https://app.netlify.com/).
2. Select site or click **Add new site** > **Import an existing project**.
3. Settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
4. Add environment variables under **Site Configuration** > **Environment variables**:
   - `VITE_API_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy site**.

---

## 6. Final Production Endpoints

- **Frontend Application (Netlify)**: `https://effulgent-twilight-1ce68d.netlify.app`
- **Backend API (Render)**: `https://cdi-edi-design-platform-1.onrender.com`
- **Health Check Endpoint**: `https://cdi-edi-design-platform-1.onrender.com/`
