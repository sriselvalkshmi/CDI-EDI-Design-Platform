# Supabase Setup & Security Guide

This document describes the Supabase PostgreSQL database tables, Row Level Security (RLS) policies, and Administrator setup.

---

## 1. Database Schema

The platform relies on 5 core PostgreSQL tables in `public` schema:

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| `profiles` | User profiles & roles | `id`, `full_name`, `email`, `role`, `created_at` |
| `equations` | Mathematical equation library | `id`, `name`, `formula`, `variables`, `category`, `enabled` |
| `login_history` | Audit log of user sign-ins/outs | `id`, `user_id`, `email`, `login_time`, `logout_time`, `session_duration`, `status` |
| `user_activity` | Action activity stream | `id`, `user_id`, `email`, `activity`, `module`, `details`, `timestamp` |
| `engineering_modifications` | Parameter modification log | `id`, `user_id`, `email`, `parameter`, `old_value`, `new_value`, `reason`, `timestamp` |

---

## 2. Automatic Profile Creation Trigger

When a user signs up via Supabase Auth, PostgreSQL automatically populates `public.profiles`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Engineer'),
        NEW.email,
        CASE 
            WHEN NEW.email = 'admin@cdiedi.com' THEN 'Administrator'
            ELSE 'User'
        END
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Administrator Setup

- **Default Administrator Email**: `admin@cdiedi.com`
- **Default Password**: `Admin@123456`

To set up the Administrator account:
1. Register `admin@cdiedi.com` in your app or Supabase Auth console.
2. Run `supabase/seed.sql` to verify `role = 'Administrator'` in `public.profiles`.
