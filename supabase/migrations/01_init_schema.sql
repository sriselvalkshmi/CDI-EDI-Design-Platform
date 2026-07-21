-- ====================================================================
-- CDI/EDI Design Platform - Database Initialization Schema
-- Migration 01: Core Tables & Signup Trigger
-- ====================================================================

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Roles Table (Default role: Engineer)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Engineer',
    CONSTRAINT unique_user_role UNIQUE (user_id)
);

-- 3. Login History Table
CREATE TABLE IF NOT EXISTS public.login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    email TEXT NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    browser TEXT,
    operating_system TEXT,
    status TEXT NOT NULL CHECK (status IN ('LOGIN', 'LOGOUT', 'FAILED LOGIN'))
);

-- 4. User Activity Table
CREATE TABLE IF NOT EXISTS public.user_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    email TEXT NOT NULL,
    activity TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Engineering Modifications Table
CREATE TABLE IF NOT EXISTS public.engineering_modifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    parameter TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Equations Table
CREATE TABLE IF NOT EXISTS public.equations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    formula TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    units VARCHAR(50),
    category VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    reference JSONB DEFAULT '{}'::jsonb,
    example TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Automatic profile and role trigger on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Engineer User'),
        NEW.email
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'Engineer')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_time ON public.login_history (login_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_time ON public.user_activity (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_eng_mods_time ON public.engineering_modifications (timestamp DESC);
