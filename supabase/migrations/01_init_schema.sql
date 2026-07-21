-- ====================================================================
-- CDI/EDI Design Platform - Supabase Production Schema
-- Migration 01: Core Tables & Profile Trigger
-- ====================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'User',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Equations Table
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
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    session_duration TEXT,
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
    email TEXT,
    parameter TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Automatic profile creation on auth.users sign up
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_login_history_time ON public.login_history (login_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_time ON public.user_activity (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_eng_mods_time ON public.engineering_modifications (timestamp DESC);
